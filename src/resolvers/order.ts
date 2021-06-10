import { v4 as uuidv4 } from 'uuid';
import {
  Resolver,
  Query,
  Mutation,
  Arg,
  InputType,
  Field,
  FieldResolver,
  Root,
} from 'type-graphql';

import { Order, OrderModel, Product, ProductModel } from '@entities';
import { Float, ID, Int } from 'type-graphql';

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

  @Field(() => Int)
  unitPrice!: number;
}

@InputType()
class OrderInput {
  @Field(() => [ProductOrderInput], { nullable: false })
  products!: ProductOrderInput[];

  @Field(() => OrderLocationInput, { nullable: false })
  location!: OrderLocationInput;

  @Field({ nullable: false })
  orderDate!: Date;

  @Field({ nullable: true })
  deliveryDate!: Date;
}

@InputType()
class OrderInputEdit {
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
  async orders(): Promise<Order[]> {
    const orders = await OrderModel.scan().exec();
    return orders;
  }

  @Query(() => Order)
  async order(@Arg('id', () => ID) id: string) {
    return OrderModel.get(id);
  }

  @Mutation(() => Order)
  async createOrder(
    @Arg('order')
    { location, orderDate, products, deliveryDate }: OrderInput,
  ) {
    const id = uuidv4();

    const product = await OrderModel.create({
      id,
      location,
      orderDate,
      products,
      deliveryDate,
    });
    return product;
  }

  @Mutation(() => [Order])
  async createCategories(
    @Arg('orders', () => [OrderInput])
    orders: OrderInput[],
  ) {
    return orders.map((order) => this.createOrder(order));
  }

  @Mutation(() => Order)
  async editOrder(
    @Arg('id', () => ID) id: string,
    @Arg('product')
    { products, location, orderDate, deliveryDate }: OrderInputEdit,
  ) {
    const order = await OrderModel.get(id);
    if (!order) throw new Error("The order don't exist");
    if (products) order.products = products;
    if (location) order.location = location;
    if (orderDate) order.orderDate = orderDate;
    if (deliveryDate) order.deliveryDate = deliveryDate;
    await order.save();
    return order;
  }

  @Mutation(() => Order)
  async addProductOrder(
    @Arg('id', () => ID) id: string,
    @Arg('product', () => ProductOrderInput)
    product: ProductOrderInput,
  ) {
    const order = await OrderModel.get(id);
    if (!order) throw new Error("The order don't exist");
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
  ) {
    const order = await OrderModel.get(id);
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
  ) {
    const order = await OrderModel.get(id);
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
  async deleteOrder(@Arg('id', () => ID) id: string) {
    try {
      await OrderModel.delete(id);
      return true;
    } catch (error) {
      return false;
    }
  }

  @FieldResolver(() => [Product], { nullable: true })
  async products(@Root() order: Order) {
    const products = await ProductModel.query('productOrderId')
      .eq(order.id)
      .exec();
    console.log(products);

    return products;
  }
}
export { OrderResolver };
