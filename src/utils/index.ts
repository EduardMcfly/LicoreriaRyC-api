import { awsS3, BUCKET } from './awsS3';
interface UploadParams<T = string> {
  key: string;
  file: T;
}
export const uploadS3 = ({
  key, // File name you want to save as in S3
  file,
}: UploadParams<Buffer>) =>
  awsS3
    .upload({
      Bucket: BUCKET,
      Key: key,
      Body: file,
    })
    .promise()
    .catch((e) => {
      console.log(e);
      throw e;
    });