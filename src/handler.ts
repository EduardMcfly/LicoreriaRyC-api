import 'dotenv/config';
import 'reflect-metadata';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  Context,
} from 'aws-lambda';
import { ApolloServer } from 'apollo-server-lambda';

import { resolvers } from '@resolvers';
import * as loaders from './loaders';
import { RequestContext } from './types';

interface ApolloContext {
  event: APIGatewayProxyEvent;
  context: Context;
}

const server = new ApolloServer({
  schema: resolvers,
  context: ({ context }: ApolloContext): RequestContext => ({
    ...context,
    loaders,
  }),
});

const { CORS } = process.env;

const handler = server.createHandler({
  cors: {
    origin: CORS.match(/\|/) ? CORS.split('|') : CORS,
    credentials: true,
  },
  uploadsConfig: { maxFileSize: 10000, maxFiles: 10 },
});

export const index: APIGatewayProxyHandler = (
  event,
  context,
  callback,
) => {
  const { headers } = event;
  event.headers['content-type'] = headers['Content-Type'];
  return handler(event, context, callback);
};
