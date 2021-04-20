import { Field, ObjectType, Int } from 'type-graphql';

@ObjectType()
export class PageInfo {
  @Field({ nullable: true })
  after?: string;
  @Field(() => Int)
  count!: number;
}
