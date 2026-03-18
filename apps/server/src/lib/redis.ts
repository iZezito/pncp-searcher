import Redis from "ioredis";

export const redis = new Redis(Bun.env.REDIS_URL!);

export const redisOptions = {
  url: Bun.env.REDIS_URL!,
  maxRetriesPerRequest: null,
};
