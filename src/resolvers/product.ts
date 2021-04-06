import { v4 as uuidv4 } from 'uuid';
import {
  Resolver,
  Query,
  Mutation,
  Arg,
  InputType,
  Field,
} from 'type-graphql';
import { GraphQLUpload } from 'apollo-server-core';
import { FileUpload } from '@apollographql/graphql-upload-8-fork';
import { MaxLength, Max, Min } from 'class-validator';

import { Product, ProductModel } from '@entities';

@InputType()
class ProductInput {
  @Field()
  @MaxLength(30)
  name: string;

  @Field({ nullable: true })
  @MaxLength(160)
  description: string;

  @Field()
  @Min(1)
  @Max(1e8)
  price: number;

  @Field(() => GraphQLUpload, { nullable: true })
  image?: FileUpload;
}

@Resolver(() => Product)
class ProductResolver {
  @Query(() => [Product])
  async products() {
    return ProductModel.scan().all().exec();
  }
  @Query(() => Product)
  async product(@Arg('id') id: string) {
    return ProductModel.get(id);
  }
  @Mutation(() => Product)
  async createProduct(
    @Arg('product') { name, description, price, image }: ProductInput,
  ) {
    console.log(image);

    const product = await ProductModel.create({
      id: uuidv4(),
      description,
      name,
      price,
      creationDate: new Date(),
    });
    return product;
  }
  @Mutation(() => Product)
  async editProduct(
    @Arg('id') id: string,
    @Arg('product') { name, description, price }: ProductInput,
  ) {
    const product = await ProductModel.get(id);
    product.name = name;
    product.price = price;
    product.description = description;
    await product.save();
    return product;
  }
  @Mutation(() => Boolean)
  async deleteProduct(@Arg('id') id: string) {
    try {
      await ProductModel.delete(id);
      return true;
    } catch (error) {
      return false;
    }
  }
}
export { ProductResolver };
