import { InputType, Field, Int } from 'type-graphql';

import { OrderTypes } from '../../../constants';

@InputType()
export class Pagination {
  @Field({ nullable: true })
  after?: string;
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
