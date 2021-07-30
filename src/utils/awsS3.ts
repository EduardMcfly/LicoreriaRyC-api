import { S3 } from 'aws-sdk';
const { BUCKET } = process.env;

export { BUCKET };
export const awsS3 = new S3();
