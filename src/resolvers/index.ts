import { buildSchemaSync } from 'type-graphql';

import { ProductResolver } from './product';

export const resolvers = buildSchemaSync({
  resolvers: [ProductResolver],
});
