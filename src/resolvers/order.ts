import {
  Arg,
  Args,
  ArgsType,
  Ctx,
  Field,
  FieldResolver,
  Float,
  ID,
  InputType,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
} from 'type-graphql';
import { v4 as uuidv4 } from 'uuid';

import { Order, ProductOrder } from '@entities';
import { RequestContext } from '../types';

@InputType()
export class OrderLocationInput {
  @Field(() => Float)
  lat!: number;

  @Field(() => Float)
  lng!: number;
}

@InputType()
export class ProductOrderInput {
  @Field(() => ID)
  id!: string;

  @Field(() => Int)
  amount!: number;
}

@InputType()
@ArgsType()
class OrderInput {
  @Field(() => [ProductOrderInput], { nullable: false })
  products!: ProductOrderInput[];

  @Field({ nullable: false })
  client!: string;

  @Field(() => OrderLocationInput, { nullable: false })
  location!: OrderLocationInput;

  @Field({ nullable: false })
  orderDate!: Date;

  @Field({ nullable: true })
  deliveryDate!: Date;
}

@InputType()
class OrderInputEdit {
  @Field({ nullable: true })
  client!: string;

  @Field(() => [ProductOrderInput], { nullable: true })
  products!: ProductOrderInput[];

  @Field(() => OrderLocationInput, { nullable: true })
  location!: OrderLocationInput;

  @Field({ nullable: true })
  orderDate!: Date;

  @Field({ nullable: true })
  deliveryDate!: Date;
}

@Resolver(() => Order)
class OrderResolver {
  @Query(() => [Order])
  async orders(
    @Ctx() { entities }: RequestContext,
  ): Promise<Order[]> {
    const orders = await entities.OrderModel.scan().exec();
    return orders;
  }

  @Query(() => Order)
  async order(
    @Arg('id', () => ID) id: string,
    @Ctx() { entities }: RequestContext,
  ) {
    return entities.OrderModel.get(id);
  }

  @Mutation(() => Order)
  async createOrder(
    @Args()
    {
      client,
      location,
      orderDate,
      products: productsInput,
      deliveryDate,
    }: OrderInput,
    @Ctx() { entities }: RequestContext,
  ) {
    const id = uuidv4();
    const products = await this.getProducts(productsInput, entities);

    const order = await entities.OrderModel.create({
      id,
      client,
      location: { ...location },
      orderDate,
      products,
      deliveryDate,
    });

    await order.conformToSchema({
      customTypesDynamo: true,
      type: 'fromDynamo',
    });

    return order;
  }

  private async getProduct(
    productInput: ProductOrderInput,
    entities: RequestContext['entities'],
  ): Promise<ProductOrder | null> {
    const product = await entities.ProductModel.get(productInput.id);
    if (!product) return null;

    return {
      ...productInput,
      name: product.name,
      image: product.image,
      unitPrice: product.price,
    };
  }

  private getProducts(
    productsInput: ProductOrderInput[],
    entities: RequestContext['entities'],
  ) {
    return Promise.all(
      productsInput.map((productInput) =>
        this.getProduct(productInput, entities),
      ),
    ).then((res) =>
      res.reduce<ProductOrder[]>((p, c) => (c ? [...p, c] : p), []),
    );
  }

  @Mutation(() => [Order])
  async createCategories(
    @Arg('orders', () => [OrderInput])
    orders: OrderInput[],
    @Ctx() context: RequestContext,
  ) {
    return orders.map((order) => this.createOrder(order, context));
  }

  @Mutation(() => Order)
  async editOrder(
    @Arg('id', () => ID) id: string,
    @Arg('product')
    {
      products: productsInput,
      client,
      location,
      orderDate,
      deliveryDate,
    }: OrderInputEdit,
    @Ctx() { entities }: RequestContext,
  ) {
    const order = await entities.OrderModel.get(id);
    if (!order) throw new Error("The order don't exist");
    const products = await this.getProducts(productsInput, entities);
    if (products) order.products = products;
    if (client) order.client = client;
    if (location) order.location = location;
    if (orderDate) order.orderDate = orderDate;
    if (deliveryDate) order.deliveryDate = deliveryDate;
    await order.save();

    await order.conformToSchema({
      customTypesDynamo: true,
      type: 'fromDynamo',
    });

    return order;
  }

  @Mutation(() => Order)
  async addProductOrder(
    @Arg('id', () => ID) id: string,
    @Arg('product', () => ProductOrderInput)
    productInput: ProductOrderInput,
    @Ctx() { entities }: RequestContext,
  ) {
    const order = await entities.OrderModel.get(id);
    if (!order) throw new Error("The order don't exist");
    const product = await this.getProduct(productInput, entities);
    if (!product) throw new Error("The product don't exist");
    order.products.push(product);
    await order.save();
    return order;
  }

  @Mutation(() => Order)
  async editProductOrder(
    @Arg('id', () => ID) id: string,
    @Arg('product', () => ID) productId: string,
    @Arg('amount', () => Int) amount: number,
    @Arg('unitPrice', () => Float) unitPrice: number,
    @Ctx() { entities }: RequestContext,
  ) {
    const order = await entities.OrderModel.get(id);
    if (!order) throw new Error("The order don't exist");
    const product = order.products.find(
      (product) => product.id === productId,
    );
    if (!product) throw new Error("The product don't exist");
    if (amount) product.amount = amount;
    if (unitPrice) product.unitPrice = unitPrice;
    await order.save();
    return order;
  }

  @Mutation(() => Order)
  async deleteProductOrder(
    @Arg('id', () => ID) id: string,
    @Arg('product', () => ID) productId: string,
    @Ctx() { entities }: RequestContext,
  ) {
    const order = await entities.OrderModel.get(id);
    if (!order) throw new Error("The order don't exist");
    const productIndex = order.products.findIndex(
      (product) => product.id !== productId,
    );
    if (productIndex === -1)
      throw new Error("The product don't exist");
    order.products.splice(productIndex, 1);
    await order.save();
    return order;
  }

  @Mutation(() => Boolean)
  async deleteOrder(
    @Arg('id', () => ID) id: string,
    @Ctx() { entities }: RequestContext,
  ) {
    try {
      await entities.OrderModel.delete(id);
      return true;
    } catch (error) {
      return false;
    }
  }

  @FieldResolver(() => [ProductOrder], { nullable: true })
  async products(@Root() order: Order) {
    return order.products;
  }
}
export { OrderResolver };
