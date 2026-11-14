import { videoTranscodeQueue } from '../config/queue.js';
import { transcodeToHLS } from '../services/ffmpegTranscoder.js';
import { Lesson } from '../models/Lesson.js';
import { Course } from '../models/Course.js';
import { getStreamingUrl } from '../config/aws.js';
import path from 'path';

let ioInstance = null;
export const setWorkerSocketIO = (io) => {
  ioInstance = io;
};

// Process video transcoding background jobs
if (videoTranscodeQueue) {
  videoTranscodeQueue.process(async (job) => {
  const { lessonId, courseId, inputFilePath, outputDir, relativeHlsDir } = job.data;
  console.log(`[Worker] Started transcoding job for Lesson: ${lessonId}`);

  try {
    // 1. Mark lesson as processing
    await Lesson.findByIdAndUpdate(lessonId, {
      'video.transcodeStatus': 'processing',
      'video.transcodeProgress': 5,
    });

    if (ioInstance) {
      ioInstance.emit('transcode-progress', { lessonId, progress: 5, status: 'processing' });
    }

    // 2. Perform FFmpeg HLS transcoding with progress callback
    const result = await transcodeToHLS(inputFilePath, outputDir, async (progressPercent) => {
      job.progress(progressPercent);
      await Lesson.findByIdAndUpdate(lessonId, {
        'video.transcodeProgress': progressPercent,
      });
      if (ioInstance) {
        ioInstance.emit('transcode-progress', {
          lessonId,
          progress: progressPercent,
          status: 'processing'
        });
      }
    });

    // 3. Resolve streaming URL via CloudFront / local CDN
    const relativeMasterM3u8 = `${relativeHlsDir}/master.m3u8`;
    const streamingUrl = getStreamingUrl(relativeMasterM3u8);
    const thumbnailUrl = getStreamingUrl(`${relativeHlsDir}/thumbnail.jpg`);

    // 4. Update Lesson with HLS streaming details
    const updatedLesson = await Lesson.findByIdAndUpdate(lessonId, {
      'video.transcodeStatus': 'ready',
      'video.transcodeProgress': 100,
      'video.hlsMasterPlaylist': relativeMasterM3u8,
      'video.streamingUrl': streamingUrl,
      'video.thumbnailUrl': thumbnailUrl,
      'video.duration': result.duration,
      'video.renditions': result.renditions.map(r => ({
        ...r,
        playlistUrl: getStreamingUrl(`${relativeHlsDir}/${r.playlist}`)
      })),
    }, { new: true });

    // Update total duration of the course
    if (courseId) {
      const allLessons = await Lesson.find({ course: courseId });
      const totalSeconds = allLessons.reduce((acc, curr) => acc + (curr.video?.duration || 0), 0);
      await Course.findByIdAndUpdate(courseId, {
        totalDuration: Math.round(totalSeconds / 60),
        totalLessons: allLessons.length,
      });
    }

    console.log(`[Worker] Successfully transcoded Lesson: ${lessonId} -> ${streamingUrl}`);

    if (ioInstance) {
      ioInstance.emit('transcode-progress', {
        lessonId,
        progress: 100,
        status: 'ready',
        streamingUrl,
        thumbnailUrl
      });
    }

    return { success: true, streamingUrl };
  } catch (err) {
    console.error(`[Worker Error] Transcoding failed for Lesson: ${lessonId}`, err);
    await Lesson.findByIdAndUpdate(lessonId, {
      'video.transcodeStatus': 'failed',
      'video.errorMessage': err.message,
    });

    if (ioInstance) {
      ioInstance.emit('transcode-progress', {
        lessonId,
        progress: 0,
        status: 'failed',
        error: err.message
      });
    }

    throw err;
  }
});
}

