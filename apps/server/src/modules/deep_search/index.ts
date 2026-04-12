import { Elysia, t } from "elysia";
import { queue } from "@/lib/queue";
import { cancelledJobs, pausedJobs } from "./cancelled-jobs";
import { io } from "@/lib/socket-io";

export const deepSearchController = new Elysia({
  prefix: "/deep-search",
})
  .post(
    "/",
    async ({ body }) => {
      const job = await queue.add("deep-search", {
        buscaId: body.planilhaId ?? "global",
        busca: body.busca,
        palavrasChave: body.palavrasChave,
        userId: "testeId",
        planilhaId: body.planilhaId ?? "",
      });
      return { jobId: job.id };
    },
    {
      body: t.Object({
        busca: t.String(),
        palavrasChave: t.Array(t.String()),
        planilhaId: t.Optional(t.String()),
      }),
    }
  )
  .delete(
    "/jobs/:jobId",
    async ({ params, set }) => {
      const job = await queue.getJob(params.jobId);

      if (!job) {
        set.status = 404;
        return { message: "Job nao encontrado" };
      }

      const state = await job.getState();

      if (state === "active") {
        cancelledJobs.add(params.jobId);
        pausedJobs.delete(params.jobId);
        return {
          message: "Job marcado para cancelamento",
          jobId: params.jobId,
        };
      }

      if (state === "waiting" || state === "delayed") {
        await job.remove();
        return { message: "Job removido da fila", jobId: params.jobId };
      }

      return {
        message: `Job ja esta em estado: ${state}`,
        jobId: params.jobId,
      };
    },
    {
      params: t.Object({
        jobId: t.String(),
      }),
    }
  )
  .post(
    "/jobs/:jobId/pause",
    async ({ params, set }) => {
      const job = await queue.getJob(params.jobId);

      if (!job) {
        set.status = 404;
        return { message: "Job nao encontrado" };
      }

      const state = await job.getState();

      if (state !== "active") {
        return {
          message: `Job nao esta ativo (estado: ${state})`,
          jobId: params.jobId,
        };
      }

      pausedJobs.add(params.jobId);
      const room = job.data.planilhaId || "global";
      io.to(room).emit("search-paused", { jobId: params.jobId });

      return { message: "Job pausado", jobId: params.jobId };
    },
    {
      params: t.Object({
        jobId: t.String(),
      }),
    }
  )
  .post(
    "/jobs/:jobId/resume",
    async ({ params, set }) => {
      const job = await queue.getJob(params.jobId);

      if (!job) {
        set.status = 404;
        return { message: "Job nao encontrado" };
      }

      pausedJobs.delete(params.jobId);
      const room = job.data.planilhaId || "global";
      io.to(room).emit("search-resumed", { jobId: params.jobId });

      return { message: "Job retomado", jobId: params.jobId };
    },
    {
      params: t.Object({
        jobId: t.String(),
      }),
    }
  )
  .get(
    "/jobs/:planilhaId/status",
    async ({ params }) => {
      const jobs = await queue.getJobs([
        "active",
        "waiting",
        "completed",
        "failed",
      ]);
      const planilhaJobs = jobs
        .filter((j) => j.data?.planilhaId === params.planilhaId)
        .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));

      if (planilhaJobs.length === 0) {
        return { status: "none", jobId: null };
      }

      const latest = planilhaJobs[0];
      const state = await latest.getState();
      const isPaused = latest.id ? pausedJobs.has(latest.id) : false;

      return { status: isPaused ? "paused" : state, jobId: latest.id };
    },
    {
      params: t.Object({
        planilhaId: t.String(),
      }),
    }
  );
