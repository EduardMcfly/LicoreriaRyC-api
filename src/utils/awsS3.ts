import AWS from 'aws-sdk';
const { BUCKET } = process.env;

export { BUCKET };
export const awsS3 = new AWS.S3();
