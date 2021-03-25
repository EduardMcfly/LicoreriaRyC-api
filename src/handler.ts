import 'dotenv/config';
import 'reflect-metadata';
import { ApolloServer } from 'apollo-server-lambda';
import { resolvers } from '@resolvers';
import typeDefs from '@schema';

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

export const index = server.createHandler({
  cors: {
    origin: true,
    credentials: true,
  },
});
