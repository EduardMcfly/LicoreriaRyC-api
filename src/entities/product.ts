import dynamoose from 'dynamoose';
import { Field, ObjectType, ID } from 'type-graphql';
import { Document } from 'dynamoose/dist/Document';

import { Category } from './category';

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
    description: { type: String, required: false },
    price: Number,
    image: { type: String, required: false },
    amount: Number,
    categoryId: {
      type: String,
      index: {
        name: 'categoryId-index',
        global: true,
        rangeKey: 'name',
      },
    },
    creationDate: Date,
  },
);
