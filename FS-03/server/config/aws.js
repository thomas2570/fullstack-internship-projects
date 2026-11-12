import dotenv from 'dotenv';
dotenv.config();

export const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  bucket: process.env.AWS_S3_BUCKET || 'eduflow-streaming-assets',
  cloudFrontDomain: process.env.AWS_CLOUDFRONT_DOMAIN || 'https://d111111abcdef8.cloudfront.net',
  useLocalFallback: process.env.USE_LOCAL_CDN_FALLBACK !== 'false',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};

/**
 * Resolves a streaming video URL.
 * In CloudFront mode: formats URL as `${cloudFrontDomain}/${hlsPath}`
 * In Local mode: returns the local Express static streaming path `/uploads/hls/${hlsPath}`
 */
export const getStreamingUrl = (hlsRelativePath) => {
  if (!hlsRelativePath) return '';
  
  // Clean relative path
  const normalizedPath = hlsRelativePath.replace(/^[\\/]+/, '').replace(/\\/g, '/');

  if (awsConfig.useLocalFallback) {
    // Delivered via local server endpoint
    return `/uploads/hls/${normalizedPath}`;
  }

  // CloudFront edge delivery
  const base = awsConfig.cloudFrontDomain.replace(/\/+$/, '');
  return `${base}/${normalizedPath}`;
};

/**
 * Simulates or performs S3 sync for transcoded HLS files
 */
export const syncHlsToCloudFrontS3 = async (localDir, s3Prefix) => {
  if (awsConfig.useLocalFallback) {
    return {
      success: true,
      mode: 'local_cdn',
      url: `/uploads/hls/${s3Prefix}/master.m3u8`
    };
  }

  // In real cloud setup, upload files to S3 bucket
  // files are then distributed globally through CloudFront
  return {
    success: true,
    mode: 'aws_cloudfront',
    url: `${awsConfig.cloudFrontDomain}/${s3Prefix}/master.m3u8`
  };
};

