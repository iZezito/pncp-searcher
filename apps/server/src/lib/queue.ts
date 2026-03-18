import { Queue } from "bullmq";

export const queue = new Queue("deep-search", {
  connection: {
    host: "localhost",
    port: 6379,
  },
});
