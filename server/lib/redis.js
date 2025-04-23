import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();
const redisClient = new Redis(process.env.UPSTASH_REDIS_URI);
redisClient.on("connect", () => {
  console.log("Connected to Redis");
});
export const redis = redisClient;
