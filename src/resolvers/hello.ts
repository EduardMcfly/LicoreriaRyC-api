import { Resolver, Query } from 'type-graphql';
@Resolver()
class HelloResolver {
  @Query(() => String)
  hello() {
    return 'Hello world!';
  }
}
export { HelloResolver };
