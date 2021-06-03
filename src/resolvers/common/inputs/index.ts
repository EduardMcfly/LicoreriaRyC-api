import { InputType, Field, Int } from 'type-graphql';

import { OrderTypes } from '../../../constants';

@InputType()
export class AfterInput {
  @Field(() => String, { nullable: true })
  id?: string;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  categoryId?: string;
}

@InputType()
export class Pagination {
  @Field({ nullable: true })
  after?: string;

  @Field(() => [AfterInput], { nullable: true })
  arrayAfter?: AfterInput[];

  @Field(() => OrderTypes, { nullable: true })
  direction!: OrderTypes;

  @Field(() => Int, { nullable: true })
  limit!: number;
}

@InputType()
export class PaginationStrict {
  @Field({ nullable: true })
  after?: string;
  @Field(() => OrderTypes)
  direction!: OrderTypes;
  @Field(() => Int)
  limit!: number;
}
