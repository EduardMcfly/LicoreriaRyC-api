import {
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from 'aws-lambda';
import resize from 'utils/resize';
import { getFileBucket, convertInt } from 'utils';

export const getImage: APIGatewayProxyHandler = async ({
  queryStringParameters: query,
}): Promise<APIGatewayProxyResult> => {
  if (!query)
    return { statusCode: 400, body: 'Parameters undefined' };
  const { file } = query;
  const format = query.format as any;

  // Parse to integer if possible
  const width = convertInt(query.width);
  const height = convertInt(query.height);

  if (!file) return { statusCode: 500, body: 'Not autorized' };
  else {
    const { Body } = await getFileBucket(file).catch((e) => {
      console.log(e);
      throw e;
    });
    if (Body instanceof Buffer)
      return resize({
        file: Body,
        format,
        width,
        height,
      })
        .then(
          ({ data, info }): APIGatewayProxyResult => {
            const content = `image/${info.format}`;
            return {
              statusCode: 200,
              headers: {
                'Content-type': content,
                'Content-Disposition': `inline; filename="${file}"`,
              },
              body: data.toString('base64'),
              isBase64Encoded: true,
            };
          },
        )
        .catch(
          (e): APIGatewayProxyResult => {
            const { message: body } = e;
            console.log(e);
            return {
              statusCode: 500,
              body,
            };
          },
        );
    else return { statusCode: 500, body: '' };
  }
};
