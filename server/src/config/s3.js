
import { S3Client } from '@aws-sdk/client-s3';

const region = process.env.AWS_REGION || 'ap-south-1';

const s3 = new S3Client({
  region,
});

export const S3_BUCKET_NAME =
  process.env.S3_BUCKET_NAME || 'shuttlepulse-badminton-storage';

export default s3;
