import { registerEnumType } from 'type-graphql';

export enum OrderTypes {
  Asc = 'ASC',
  Desc = 'DESC',
}

registerEnumType(OrderTypes, {
  name: 'OrderTypes',
  description: 'The basic directions',
});
