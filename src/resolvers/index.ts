import { buildSchemaSync } from 'type-graphql';

import { ProductResolver } from './product';
import { CategoryResolver } from './category';
import { CartResolver } from './cart';
import { OrderResolver } from './order';

export const resolvers = buildSchemaSync({
  resolvers: [
    ProductResolver,
    CategoryResolver,
    CartResolver,
    OrderResolver,
  ],
});
