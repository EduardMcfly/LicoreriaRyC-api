import { Resolver, Query, Arg } from 'type-graphql';
import { ID } from 'type-graphql';

import { Product, ProductModel } from '@entities';

@Resolver(() => Product)
export class CartResolver {
  @Query(() => [Product])
  async cartProducts(
    @Arg('products', () => [ID]) products: string[],
  ): Promise<Product[]> {
    const data = await Promise.all(
      products.map((product) => ProductModel.get(product)),
    );
    return data.filter((product) => product);
  }

  @Query(() => Product)
  async cartProduct(@Arg('product', () => ID) product: string) {
    return ProductModel.get(product);
  }
}
