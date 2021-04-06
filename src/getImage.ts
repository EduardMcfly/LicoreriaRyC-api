import {
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from 'aws-lambda';
import resize from 'utils/resize';
import { getFileBucket, convertInt } from 'utils';

export const getImage: APIGatewayProxyHandler = async ({
  queryStringParameters: parameters,
}): Promise<APIGatewayProxyResult> => {
  if (!parameters)
    return { statusCode: 400, body: 'Parameters undefined' };
  const { file } = parameters;
  const format = parameters.format as any;

  // Parse to integer if possible
  const width = convertInt(parameters.width);
  const height = convertInt(parameters.height);

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
          ({ data }): APIGatewayProxyResult => ({
            statusCode: 200,
            body: JSON.stringify({ file: data.toString('base64') }),
          }),
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
