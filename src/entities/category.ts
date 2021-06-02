import dynamoose from 'dynamoose';
import { Field, ObjectType, ID } from 'type-graphql';
import { Document } from 'dynamoose/dist/Document';

@ObjectType()
export class Category {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  description!: string;

  @Field({ nullable: true })
  image?: string;
}

export const categorySchema = new dynamoose.Schema({
  id: {
    type: String,
    index: {
      name: 'idIndex',
      global: true,
    },
  },
  name: String,
  description: String,
  image: String,
});

export const CategoryModel = dynamoose.model<Category & Document>(
  process.env.CATEGORY_TABLE,
  categorySchema,
);
