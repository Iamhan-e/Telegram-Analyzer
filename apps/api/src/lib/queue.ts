import { Queue } from "bullmq";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let _queue: Queue | null = null;

export function getFullScrapeQueue(): Queue {
  if (!_queue) {
    _queue = new Queue("full_scrape", {
      connection: { url: REDIS_URL },
    });
  }
  return _queue;
}
