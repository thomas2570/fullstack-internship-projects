import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import fs from 'fs';
import path from 'path';

// Set binary paths from installers
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

/**
 * Probes a video file to retrieve metadata (duration, width, height)
 */
export const probeVideo = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const videoStream = metadata.streams.find(s => s.codec_type === 'video') || {};
      resolve({
        duration: metadata.format.duration || 0,
        width: videoStream.width || 1280,
        height: videoStream.height || 720,
        bitrate: metadata.format.bit_rate || 2000000,
      });
    });
  });
};

/**
 * Extracts a thumbnail from a video at the 1 second mark
 */
export const extractThumbnail = (videoPath, outputDir, filename = 'thumbnail.jpg') => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: ['00:00:01'],
        filename,
        folder: outputDir,
        size: '640x360',
      })
      .on('end', () => resolve(path.join(outputDir, filename)))
      .on('error', (err) => reject(err));
  });
};

/**
 * Transcodes an uploaded video file into standard HLS (HTTP Live Streaming) format
 * Generates .m3u8 playlist and .ts chunk segments with multi-bitrate/adaptive streaming capabilities.
 */
export const transcodeToHLS = async (inputPath, outputDir, onProgress) => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const metadata = await probeVideo(inputPath);
  const totalDuration = metadata.duration || 10;

  // We build a robust HLS stream:
  // 1) 720p stream
  // 2) 360p stream
  // 3) master playlist linking them
  const p720Dir = path.join(outputDir, '720p');
  const p360Dir = path.join(outputDir, '360p');
  if (!fs.existsSync(p720Dir)) fs.mkdirSync(p720Dir, { recursive: true });
  if (!fs.existsSync(p360Dir)) fs.mkdirSync(p360Dir, { recursive: true });

  // 1. Transcode 720p
  await new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-profile:v main',
        '-level 3.1',
        '-s 1280x720',
        '-start_number 0',
        '-hls_time 6',
        '-hls_list_size 0',
        '-f hls'
      ])
      .videoCodec('libx264')
      .audioCodec('aac')
      .audioBitrate('128k')
      .videoBitrate('2500k')
      .output(path.join(p720Dir, 'index.m3u8'))
      .on('progress', (progress) => {
        if (onProgress && progress.timemark) {
          const parts = progress.timemark.split(':');
          const currentSeconds = (+parts[0]) * 3600 + (+parts[1]) * 60 + (+parts[2]);
          const percent = Math.min(50, Math.round((currentSeconds / totalDuration) * 50));
          onProgress(percent);
        }
      })
      .on('end', resolve)
      .on('error', reject)
      .run();
  });

  // 2. Transcode 360p
  await new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-profile:v baseline',
        '-level 3.0',
        '-s 640x360',
        '-start_number 0',
        '-hls_time 6',
        '-hls_list_size 0',
        '-f hls'
      ])
      .videoCodec('libx264')
      .audioCodec('aac')
      .audioBitrate('96k')
      .videoBitrate('800k')
      .output(path.join(p360Dir, 'index.m3u8'))
      .on('progress', (progress) => {
        if (onProgress && progress.timemark) {
          const parts = progress.timemark.split(':');
          const currentSeconds = (+parts[0]) * 3600 + (+parts[1]) * 60 + (+parts[2]);
          const percent = 50 + Math.min(45, Math.round((currentSeconds / totalDuration) * 45));
          onProgress(percent);
        }
      })
      .on('end', resolve)
      .on('error', reject)
      .run();
  });

  // 3. Generate Master HLS Playlist (master.m3u8)
  const masterPlaylistContent = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=2628000,RESOLUTION=1280x720
720p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=896000,RESOLUTION=640x360
360p/index.m3u8
`;

  const masterPlaylistPath = path.join(outputDir, 'master.m3u8');
  fs.writeFileSync(masterPlaylistPath, masterPlaylistContent);

  // 4. Generate thumbnail
  try {
    await extractThumbnail(inputPath, outputDir, 'thumbnail.jpg');
  } catch (err) {
    console.warn('Thumbnail extraction warning:', err.message);
  }

  if (onProgress) onProgress(100);

  return {
    masterPlaylistPath,
    duration: Math.round(totalDuration),
    renditions: [
      { resolution: '720p', playlist: '720p/index.m3u8', bitrate: '2500k' },
      { resolution: '360p', playlist: '360p/index.m3u8', bitrate: '800k' },
    ]
  };
};

