import { Worker, Job } from "bullmq";
import axios from "axios";
import type {
  ApiResponse,
  DeepSearchJobData,
  FoundItem,
  PageResult,
  ProcurementItem,
  CompraItem,
} from "./lib/types";
import { io } from "./lib/socket-io";

const api = axios.create({
  baseURL: "https://pncp.gov.br/api/",
  timeout: 10000,
});

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const current = index++;
      results[current] = await tasks[current]();
    }
  }

  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

new Worker<DeepSearchJobData>(
  "deep-search",
  async (job: Job<DeepSearchJobData>) => {
    const { busca, buscaId, palavrasChave } = job.data;

    const jobStart = Date.now();
    console.log(`\n${"=".repeat(60)}`);
    console.log(`[Job] 🚀 Iniciando job #${job.id}`);
    console.log(`[Job]    buscaId      : ${buscaId}`);
    console.log(`[Job]    busca        : "${busca}"`);
    console.log(`[Job]    palavrasChave: [${palavrasChave.join(", ")}]`);
    console.log(`${"=".repeat(60)}\n`);

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      console.warn(
        `[Job] ⏱️  Timeout de 120s atingido — abortando job #${job.id}`,
      );
      controller.abort();
    }, 120_000);

    const keywords = palavrasChave.map(normalize);
    console.log(`[Job] 🔑 Keywords normalizadas: [${keywords.join(", ")}]`);

    let totalEncontrados = 0;

    try {
      let pagina = 1;
      const tamanhoPagina = 10;

      // ─── Loop de paginação externa ────────────────────────────────────────
      while (true) {
        if (controller.signal.aborted) {
          console.warn(
            `[Paginação] ⛔ Sinal de abort ativo — encerrando loop.`,
          );
          break;
        }

        console.log(`\n[Paginação] 📄 Buscando página externa ${pagina}...`);

        const pageStart = Date.now();
        const response = await api.get<ApiResponse>("/search/", {
          signal: controller.signal,
          params: {
            q: busca,
            tipos_documento: "edital",
            ordenacao: "-data",
            pagina,
            tam_pagina: tamanhoPagina,
            status: "todos",
          },
        });
        console.log(
          `[Paginação] ✅ Página ${pagina} recebida em ${Date.now() - pageStart}ms — ${response.data.items.length} edital(is) retornado(s)`,
        );

        const items = response.data.items;

        if (!items.length) {
          console.log(
            `[Paginação] 🏁 Nenhum item na página ${pagina}. Fim da paginação externa.`,
          );
          break;
        }

        // ─── Loop de editais da página ──────────────────────────────────────
        for (const [index, item] of items.entries()) {
          if (controller.signal.aborted) {
            console.warn(
              `[Edital] ⛔ Abort detectado — pulando restante dos editais.`,
            );
            break;
          }

          const editalLabel = `${item.orgao_cnpj}/${item.ano}/${item.numero_sequencial}`;
          console.log(
            `\n[Edital] 📋 (${index + 1}/${items.length}) Processando: ${editalLabel}`,
          );

          // ─── Quantidade de itens internos ─────────────────────────────────
          console.log(
            `[Edital] 🔢 Buscando quantidade de itens de ${editalLabel}...`,
          );
          const quantStart = Date.now();

          const quantidadeItens = await api
            .get<number>(
              `/pncp/v1/orgaos/${item.orgao_cnpj}/compras/${item.ano}/${item.numero_sequencial}/itens/quantidade`,
              { signal: controller.signal },
            )
            .then((r) => r.data);

          console.log(
            `[Edital] ✅ ${quantidadeItens} item(ns) encontrado(s) em ${Date.now() - quantStart}ms`,
          );

          const paginasInternas = Math.ceil(quantidadeItens / 50) || 1;
          console.log(
            `[Edital] 📑 ${paginasInternas} página(s) interna(s) a buscar (50 itens/página)`,
          );

          // ─── Busca paralela das páginas internas ──────────────────────────
          const tasks: (() => Promise<PageResult | null>)[] = Array.from(
            { length: paginasInternas },
            (_, i) => {
              return async () => {
                if (controller.signal.aborted) {
                  console.warn(
                    `[Itens] ⛔ Abort — pulando página interna ${i + 1} de ${editalLabel}`,
                  );
                  return null;
                }

                console.log(
                  `[Itens] ⬇️  Baixando página interna ${i + 1}/${paginasInternas} de ${editalLabel}...`,
                );
                const internalStart = Date.now();

                const res = await api.get<CompraItem[]>(
                  `/pncp/v1/orgaos/${item.orgao_cnpj}/compras/${item.ano}/${item.numero_sequencial}/itens`,
                  {
                    signal: controller.signal,
                    params: {
                      pagina: i + 1,
                      tamanhoPagina: 50,
                    },
                  },
                );

                console.log(
                  `[Itens] ✅ Página interna ${i + 1}/${paginasInternas} de ${editalLabel} recebida em ${Date.now() - internalStart}ms — ${res.data.length} item(ns)`,
                );

                return { page: i + 1, data: res.data };
              };
            },
          );

          const concurrencyStart = Date.now();
          const pages = await runWithConcurrency(tasks, 5);
          console.log(
            `[Edital] ⚡ Todas as páginas internas de ${editalLabel} processadas em ${Date.now() - concurrencyStart}ms`,
          );

          // ─── Filtragem por palavras-chave ─────────────────────────────────
          let matchesNesteEdital = 0;

          for (const pageResult of pages) {
            if (!pageResult || controller.signal.aborted) continue;

            for (const itemDetail of pageResult.data) {
              const descricaoNormalizada = normalize(itemDetail.descricao);

              const matchedKeyword = keywords.find((k) =>
                descricaoNormalizada.includes(k),
              );

              if (matchedKeyword) {
                totalEncontrados++;
                matchesNesteEdital++;

                console.log(
                  `[Match] 🎯 Keyword "${matchedKeyword}" encontrada em ${editalLabel} — item: "${itemDetail.descricao.slice(0, 80)}..."`,
                );

                const result: FoundItem = {
                  link: `https://pncp.gov.br/app/editais/${item.orgao_cnpj}/${item.ano}/${item.numero_sequencial}`,
                  valor: itemDetail.valorUnitarioEstimado,
                  descricao: itemDetail.descricao,
                  paginaExterna: pagina,
                  paginaInterna: pageResult.page,
                  unidadeMedida: itemDetail.unidadeMedida,
                };

                // 👉 salvar no banco
                // await db.insert(itens)...

                // 👉 websocket
                // sendToUser(job.data.userId, result);
                io.emit(buscaId, result);
                console.log(
                  `[Socket] 📡 Evento "${buscaId}" emitido via socket.io`,
                );
              }
            }
          }

          console.log(
            `[Edital] ${matchesNesteEdital > 0 ? "🟢" : "⚪"} ${editalLabel} — ${matchesNesteEdital} match(es) neste edital`,
          );
        }

        pagina++;
      }

      const elapsed = ((Date.now() - jobStart) / 1000).toFixed(2);
      console.log(`\n${"=".repeat(60)}`);
      console.log(`[Job] ✅ Job #${job.id} concluído em ${elapsed}s`);
      console.log(`[Job]    Total encontrados: ${totalEncontrados}`);
      console.log(`${"=".repeat(60)}\n`);

      return { totalEncontrados };
    } catch (err: any) {
      if (err.name === "AbortError" || controller.signal.aborted) {
        const elapsed = ((Date.now() - jobStart) / 1000).toFixed(2);
        console.warn(
          `\n[Job] ⏱️  Job #${job.id} abortado por timeout após ${elapsed}s`,
        );
        console.warn(
          `[Job]    Total encontrados até o abort: ${totalEncontrados}`,
        );
        return { timeout: true, totalEncontrados };
      }

      console.error(`\n[Job] ❌ Erro inesperado no job #${job.id}:`);
      console.error(`[Job]    Tipo   : ${err.name}`);
      console.error(`[Job]    Mensagem: ${err.message}`);
      if (err.response) {
        console.error(`[Job]    Status HTTP : ${err.response.status}`);
        console.error(`[Job]    URL        : ${err.config?.url}`);
        console.error(
          `[Job]    Parâmetros : ${JSON.stringify(err.config?.params)}`,
        );
      }
      console.error(`[Job]    Stack:\n`, err.stack);

      throw err;
    } finally {
      clearTimeout(timeout);
    }
  },
  {
    connection: {
      host: "localhost",
      port: 6379,
    },
    concurrency: 5,
  },
);
