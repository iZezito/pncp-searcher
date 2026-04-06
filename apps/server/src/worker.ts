import { Worker, Job } from "bullmq";
import axios, { AxiosRequestConfig } from "axios";
import type {
  ApiResponse,
  DeepSearchJobData,
  FoundItem,
  PageResult,
  CompraItem,
} from "./lib/types";
import { io } from "./lib/socket-io";
import {
  cancelledJobs,
  pausedJobs,
} from "./modules/deep_search/cancelled-jobs";

const api = axios.create({
  baseURL: "https://pncp.gov.br/api/",
  timeout: 15000,
});

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Timeout manual"));
    }, ms);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function requestWithRetry<T>(
  config: AxiosRequestConfig,
  options?: {
    retries?: number;
    timeoutMs?: number;
    baseDelayMs?: number;
  },
): Promise<T> {
  const retries = options?.retries ?? 3;
  const timeoutMs = options?.timeoutMs ?? 10000;
  const baseDelayMs = options?.baseDelayMs ?? 300;

  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await withTimeout(api.request<T>(config), timeoutMs);
      return res.data;
    } catch (err: any) {
      lastError = err;

      console.warn(
        `[HTTP] ❌ Tentativa ${attempt + 1}/${retries + 1}: ${err.message}`,
      );

      if (attempt === retries) break;

      const delay = baseDelayMs * 2 ** attempt;
      await sleep(delay);
    }
  }

  throw lastError;
}

class RateLimiter {
  private queue: (() => void)[] = [];
  private active = 0;

  constructor(
    private maxConcurrent: number,
    private delayMs: number,
  ) {}

  async schedule<T>(task: () => Promise<T>): Promise<T> {
    if (this.active >= this.maxConcurrent) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }

    this.active++;

    try {
      const result = await task();
      await sleep(this.delayMs);
      return result;
    } finally {
      this.active--;

      const next = this.queue.shift();
      if (next) next();
    }
  }
}

const limiter = new RateLimiter(5, 50);

class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: "CLOSED" | "OPEN" | "HALF" = "CLOSED";

  constructor(
    private failureThreshold = 5,
    private cooldownMs = 10000,
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.cooldownMs) {
        this.state = "HALF";
      } else {
        throw new Error("Circuit breaker OPEN");
      }
    }

    try {
      const result = await fn();

      this.failures = 0;
      this.state = "CLOSED";

      return result;
    } catch (err) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.failureThreshold) {
        this.state = "OPEN";
        console.warn("[CircuitBreaker] 🔴 OPEN");
      }

      throw err;
    }
  }
}

const breaker = new CircuitBreaker();

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let index = 0;

  async function worker() {
    while (true) {
      const current = index++;
      if (current >= tasks.length) break;

      try {
        results[current] = await tasks[current]();
      } catch (err) {
        console.error(`[Worker] ❌ Erro na task ${current}`);
        results[current] = null as T;
      }
    }
  }

  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

function isJobCancelled(jobId: string | undefined): boolean {
  if (!jobId) return false;
  return cancelledJobs.has(jobId);
}

async function waitWhilePaused(
  jobId: string | undefined,
  room: string,
): Promise<void> {
  if (!jobId) return;
  let notified = false;
  while (pausedJobs.has(jobId)) {
    if (!notified) {
      console.log(`[Job] ⏸️ Job #${jobId} pausado`);
      notified = true;
    }
    // Also check cancellation while paused
    if (isJobCancelled(jobId)) return;
    await sleep(500);
  }
  if (notified) {
    console.log(`[Job] ▶️ Job #${jobId} retomado`);
  }
}

new Worker<DeepSearchJobData>(
  "deep-search",
  async (job: Job<DeepSearchJobData>) => {
    const { busca, planilhaId, palavrasChave } = job.data;
    const room = planilhaId || "global";

    const jobStart = Date.now();

    console.log(`\n${"=".repeat(60)}`);
    console.log(`[Job] 🚀 Iniciando job #${job.id}`);
    console.log(`[Job] busca: "${busca}" | planilha: "${planilhaId}"`);
    console.log(`${"=".repeat(60)}\n`);

    // Notify clients that the search has started
    io.to(room).emit("search-started", { jobId: job.id, planilhaId });

    const keywords = palavrasChave.map(normalize);
    let totalEncontrados = 0;

    try {
      let pagina = 1;
      const MAX_PAGINAS = 50;

      while (pagina <= MAX_PAGINAS) {
        // Wait while paused
        await waitWhilePaused(job.id, room);

        // Check cancellation before each page
        if (isJobCancelled(job.id)) {
          console.log(`[Job] 🛑 Job #${job.id} cancelado pelo usuário`);
          cancelledJobs.delete(job.id!);
          io.to(room).emit("search-stopped", {
            jobId: job.id,
            planilhaId,
            totalEncontrados,
          });
          return { totalEncontrados, cancelled: true };
        }

        console.log(`\n[Paginação] 📄 Página ${pagina}`);

        const response = await limiter.schedule(() =>
          breaker.execute(() =>
            requestWithRetry<ApiResponse>({
              url: "/search/",
              method: "GET",
              params: {
                q: busca,
                tipos_documento: "edital",
                ordenacao: "-data",
                pagina,
                tam_pagina: 10,
                status: "todos",
              },
            }),
          ),
        );

        if (!response.items.length) break;

        for (const item of response.items) {
          // Wait while paused
          await waitWhilePaused(job.id, room);

          // Check cancellation before each edital
          if (isJobCancelled(job.id)) {
            console.log(`[Job] 🛑 Job #${job.id} cancelado pelo usuário`);
            cancelledJobs.delete(job.id!);
            io.to(room).emit("search-stopped", {
              jobId: job.id,
              planilhaId,
              totalEncontrados,
            });
            return { totalEncontrados, cancelled: true };
          }

          const editalLabel = `${item.orgao_cnpj}/${item.ano}/${item.numero_sequencial}`;

          console.log(`[Edital] 📋 ${editalLabel}`);

          let quantidadeItens = 0;

          try {
            quantidadeItens = await limiter.schedule(() =>
              breaker.execute(() =>
                requestWithRetry<number>({
                  url: `/pncp/v1/orgaos/${item.orgao_cnpj}/compras/${item.ano}/${item.numero_sequencial}/itens/quantidade`,
                  method: "GET",
                }),
              ),
            );
          } catch {
            console.warn(`[Edital] ❌ Falha ao obter quantidade`);
            continue;
          }

          const paginasInternas = Math.ceil(quantidadeItens / 50) || 1;

          const tasks = Array.from({ length: paginasInternas }, (_, i) => {
            return async () => {
              try {
                const data = await limiter.schedule(() =>
                  breaker.execute(() =>
                    requestWithRetry<CompraItem[]>({
                      url: `/pncp/v1/orgaos/${item.orgao_cnpj}/compras/${item.ano}/${item.numero_sequencial}/itens`,
                      method: "GET",
                      params: {
                        pagina: i + 1,
                        tamanhoPagina: 50,
                      },
                    }),
                  ),
                );

                return { page: i + 1, data };
              } catch (err: any) {
                console.warn(
                  `[Itens] ❌ Página ${i + 1} falhou: ${err.message}`,
                );
                return null;
              }
            };
          });

          const pages = await runWithConcurrency(tasks, 5);

          for (const pageResult of pages) {
            if (!pageResult) continue;

            for (const itemDetail of pageResult.data) {
              const desc = normalize(itemDetail.descricao);

              const matched = keywords.find((k) => desc.includes(k));

              if (matched) {
                totalEncontrados++;

                const result: FoundItem = {
                  link: `https://pncp.gov.br/app/editais/${item.orgao_cnpj}/${item.ano}/${item.numero_sequencial}`,
                  valor: itemDetail.valorUnitarioEstimado,
                  descricao: itemDetail.descricao,
                  paginaExterna: pagina,
                  paginaInterna: pageResult.page,
                  unidadeMedida: itemDetail.unidadeMedida,
                  fonte: `${item.title} - Local: ${item.municipio_nome}/${item.uf} - Órgão: ${item.orgao_nome}`,
                };

                io.to(room).emit("search-result", result);
              }
            }
          }
        }

        pagina++;
      }

      console.log(`\n[Job] ✅ Finalizado`);
      console.log(`[Job] Total encontrados: ${totalEncontrados}`);

      io.to(room).emit("search-completed", {
        jobId: job.id,
        planilhaId,
        totalEncontrados,
      });

      return { totalEncontrados };
    } catch (err: any) {
      console.error(`[Job] ❌ Erro: ${err.message}`);
      io.to(room).emit("search-stopped", {
        jobId: job.id,
        planilhaId,
        error: err.message,
      });
      throw err;
    }
  },
  {
    connection: {
      host: "localhost",
      port: 6379,
    },
    concurrency: 3,
  },
);
