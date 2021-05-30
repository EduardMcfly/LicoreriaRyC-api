import dynamoose from 'dynamoose';
import { Document } from 'dynamoose/dist/Document';
import { Field, ObjectType, ID } from 'type-graphql';

@ObjectType()
export class Category extends Document {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;
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
});

export const CategoryModel = dynamoose.model<Category>(
  process.env.CATEGORY_TABLE,
  categorySchema,
);
