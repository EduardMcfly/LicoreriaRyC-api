import 'dotenv/config';
import 'reflect-metadata';
import { ApolloServer } from 'apollo-server-lambda';
import { resolvers } from '@resolvers';

const server = new ApolloServer({
  schema: resolvers,
});

export const index = server.createHandler({
  cors: {
    origin: true,
    credentials: true,
  },
});
