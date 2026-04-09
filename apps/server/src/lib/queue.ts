import { Queue } from "bullmq";

export const queue = new Queue("deep-search", {
  connection: {
    url: Bun.env.REDIS_URL,
  },
});
