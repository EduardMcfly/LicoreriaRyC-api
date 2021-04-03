import { Stream } from 'stream';
import { Field, InputType } from 'type-graphql';

@InputType()
export class FileInput {
  @Field(() => Stream)
  stream: Stream;

  @Field() filename: string;

  @Field() mimetype: string;

  @Field() encoding: string;
}
