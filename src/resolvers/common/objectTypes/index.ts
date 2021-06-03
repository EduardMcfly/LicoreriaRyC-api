import { Field, Int, ObjectType } from 'type-graphql';

@ObjectType()
export class After {
  @Field(() => String, { nullable: true })
  id?: string;
  @Field(() => String, { nullable: true })
  name?: string;
  @Field(() => String, { nullable: true })
  categoryId?: string;
}

@ObjectType()
export class PageInfo {
  @Field({ nullable: true })
  after?: string;
  @Field(() => [After], { nullable: 'itemsAndList' })
  arrayAfter?: (After | undefined)[];
  @Field(() => Int)
  count!: number;
}
