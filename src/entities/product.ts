import dynamoose from 'dynamoose';
import { Document } from 'dynamoose/dist/Document';
import { Field, ObjectType, ID } from 'type-graphql';

@ObjectType()
export class Product extends Document {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  price: number;

  @Field()
  creationDate: Date;
}

export const ProductModel = dynamoose.model<Product>(
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
    creationDate: Date,
  },
);
