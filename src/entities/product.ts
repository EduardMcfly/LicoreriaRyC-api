import dynamoose from 'dynamoose';
import { Field, ObjectType, ID } from 'type-graphql';
import { Document } from 'dynamoose/dist/Document';

import { categorySchema, CategoryModel, Category } from './category';

@ObjectType()
export class Product {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  categoryId?: string;

  @Field(() => Category, { nullable: true })
  category?: Category;

  @Field()
  price!: number;

  @Field({ nullable: true })
  image?: string;

  @Field({ nullable: true })
  amount?: number;

  @Field()
  creationDate!: Date;
}

export const ProductModel = dynamoose.model<Product & Document>(
  process.env.DYNAMODB_TABLE,
  {
    id: {
      type: String,
      index: {
        name: 'idIndex',
        global: true,
      },
    },
    name: String,
    description: String,
    price: Number,
    image: String,
    amount: Number,
    categoryId: {
      type: String,
      index: {
        name: 'categoryId-index',
        global: true,
      },
    },
    category: {
      type: CategoryModel,
      schema: categorySchema,
    },
    creationDate: Date,
  },
);
