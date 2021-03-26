import { buildSchemaSync } from 'type-graphql';

import { HelloResolver } from './hello';
import { ProductResolver } from './product';

export const resolvers = buildSchemaSync({
  resolvers: [HelloResolver, ProductResolver],
});
