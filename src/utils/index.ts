import { Body } from 'aws-sdk/clients/s3';
import { awsS3, BUCKET } from './awsS3';

interface UploadParams<T = string> {
  key: string;
  file: T;
}

export const uploadS3 = ({
  key, // File name you want to save as in S3
  file,
}: UploadParams<Body>) =>
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

// fetch todo from the Bucket
export const getFileBucket = (Key: string) =>
  awsS3
    .getObject({
      Bucket: BUCKET,
      Key,
    })
    .promise();

export const convertInt = (text?: string): number | undefined => {
  const number = (text && +text) || 0;
  return (!isNaN(number) && number) || undefined;
};

export const cleanURL = (url?: string) => {
  if (!url) {
    console.log('url is ' + typeof url);
    return '';
  }
  return url.replace(/\/$/, '') + '/';
};

const { APP_URL } = process.env;
export const generateAppRoute = (path: string) =>
  cleanURL(APP_URL) + path.replace(/\//, '');

export const generateOrderRoute = (order: string) => {
  const url = generateAppRoute('/order/');
  return url + order.replace(/\//, '');
};
