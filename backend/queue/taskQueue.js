const { Queue } = require('bullmq');

const REDIS_URL = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;

let taskQueue = null;
let queueEnabled = false;

const connectionOptions = REDIS_URL
  ? { connection: { url: REDIS_URL } }
  : REDIS_HOST
  ? { connection: { host: REDIS_HOST, port: Number(REDIS_PORT) || 6379 } }
  : null;

const initializeQueue = () => {
  if (!connectionOptions) {
    console.warn('⚠️  Task queue disabled: REDIS_URL or REDIS_HOST is not configured.');
    return;
  }

  try {
    taskQueue = new Queue('coli-tasks', {
      ...connectionOptions,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 20,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    });

    queueEnabled = true;
    console.log('✅ BullMQ queue initialized for enqueue-only API layer');
  } catch (err) {
    console.error('❌ Failed to initialize BullMQ queue:', err.message || err);
    console.warn('⚠️  Continuing without Redis-backed task queue. Background jobs will be limited.');
  }
};

initializeQueue();

async function addTask(type, data, options = {}) {
  if (!queueEnabled || !taskQueue) {
    console.warn(`[TASK QUEUE] Redis queue unavailable; skipping enqueue for task type=${type}`);
    return null;
  }

  let delay = 0;
  let jobOptions = {
    removeOnComplete: 50,
    removeOnFail: 20,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  };

  if (typeof options === 'number') {
    delay = options;
  } else if (options && typeof options === 'object') {
    delay = options.delay || 0;
    jobOptions = { ...jobOptions, ...options };
  }

  // Add idempotency key for analysis jobs
  if (type === 'run-analysis' && data.jobId) {
    jobOptions.jobId = `analysis-${data.jobId}`;
  }

  const job = await taskQueue.add('coli-task', { type, data }, {
    delay,
    ...jobOptions,
  });

  console.log(`[TASK QUEUE] Enqueued ${type} job ${job.id}`);
  return job.id;
}

async function checkDuplicateJob(jobId) {
  if (!queueEnabled || !taskQueue) {
    return false;
  }

  try {
    const jobs = await taskQueue.getJobs(['active', 'waiting', 'delayed'], 0, 100);
    return jobs.some(job => job.data.type === 'run-analysis' && job.data.data?.jobId === jobId);
  } catch (error) {
    console.error('[TASK QUEUE] Error checking for duplicate jobs:', error.message);
    return false;
  }
}

async function scheduleRecurringTasks() {
  if (!queueEnabled) {
    console.warn('⚠️  Cannot schedule recurring tasks because Redis queue is unavailable.');
    return;
  }

  await addTask('predict-trends', {}, 24 * 60 * 60 * 1000);
  await addTask('suggest-research', { userId: 'default', interests: ['AI', 'science'] }, 7 * 24 * 60 * 60 * 1000);
}

module.exports = { taskQueue, addTask, scheduleRecurringTasks, checkDuplicateJob };