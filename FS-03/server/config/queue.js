import Bull from 'bull';
import dotenv from 'dotenv';
dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
  enableReadyCheck: false
};

// Initialize background queue for video transcoding
export const videoTranscodeQueue = new Bull('video-transcode-queue', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: false,
    removeOnFail: false
  }
});

videoTranscodeQueue.on('error', (err) => {
  console.warn('[Queue Warning]', err.message);
});

console.log(`[Queue] Video Transcoding Queue initialized on Redis ${redisConfig.host}:${redisConfig.port}`);

