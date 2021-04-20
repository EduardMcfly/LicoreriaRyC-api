import { Query } from 'dynamoose/dist/DocumentRetriever';
import { DocumentArray, ObjectType } from 'dynamoose/dist/General';

export type DocumentRetriever<A> = ReturnType<Query<A>['limit']>;

export interface DocumentRetrieverResponse<T>
  extends DocumentArray<T> {
  lastKey?: ObjectType;
  count: number;
}
