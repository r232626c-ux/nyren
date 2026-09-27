const { Worker, QueueScheduler } = require('bullmq');
const { processAnalysisJob } = require('../services/analysisService');

const REDIS_URL = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;
const WORKER_CONCURRENCY = Number(process.env.WORKER_CONCURRENCY || 4);

const connectionOptions = REDIS_URL
  ? { connection: { url: REDIS_URL } }
  : REDIS_HOST
  ? { connection: { host: REDIS_HOST, port: Number(REDIS_PORT) || 6379 } }
  : null;

if (!connectionOptions) {
  console.error('❌ Redis connection is required to start the analysis worker.');
  process.exit(1);
}

const scheduler = new QueueScheduler('coli-tasks', connectionOptions);
const worker = new Worker('coli-tasks', async (job) => {
  const { type, data } = job.data;
  const start = Date.now();
  console.log(`[WORKER] Processing job ${job.id} type=${type} attempts=${job.attemptsMade + 1}`);

  switch (type) {
    case 'run-analysis':
      await processAnalysisJob(data, job.attemptsMade || 0);
      break;
    default:
      throw new Error(`Unsupported queue task type: ${type}`);
  }

  const duration = Date.now() - start;
  console.log(`[WORKER] Completed job ${job.id} type=${type} in ${duration}ms`);
}, {
  ...connectionOptions,
  concurrency: WORKER_CONCURRENCY,
  lockDuration: 15 * 60 * 1000, // 15 minutes
  autorun: true,
});

worker.on('completed', (job) => {
  console.log(`[WORKER] Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`[WORKER] Job ${job.id} failed on attempt ${job.attemptsMade}:`, err.message);
});

worker.on('error', (err) => {
  console.error('[WORKER] Worker error:', err.message || err);
});

process.on('SIGINT', async () => {
  console.log('[WORKER] Shutting down worker gracefully');
  await worker.close();
  await scheduler.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[WORKER] Shutting down worker gracefully');
  await worker.close();
  await scheduler.close();
  process.exit(0);
});
