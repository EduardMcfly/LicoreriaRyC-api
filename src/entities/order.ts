import dynamoose from 'dynamoose';
import { Field, ObjectType, ID, Float, Int } from 'type-graphql';
import { Document } from 'dynamoose/dist/Document';

@ObjectType()
export class OrderLocation {
  @Field(() => Float)
  lat!: number;

  @Field(() => Float)
  lng!: number;
}

@ObjectType()
class ProductOrder {
  @Field(() => ID)
  id!: string;

  @Field(() => Int)
  amount!: number;

  @Field(() => Int)
  unitPrice!: number;
}

@ObjectType()
export class Order {
  @Field(() => ID)
  id!: string;

  @Field(() => [ProductOrder], { nullable: false })
  products!: ProductOrder[];

  @Field(() => OrderLocation, { nullable: false })
  location?: OrderLocation;

  @Field({ nullable: false })
  orderDate!: Date;

  @Field({ nullable: true })
  deliveryDate!: Date;
}

export const orderSchema = new dynamoose.Schema(
  {
    id: {
      type: String,
      index: {
        name: 'id-index',
        global: true,
        rangeKey: 'orderDate',
      },
    },
    products: {
      type: Array,
      required: true,
      schema: [
        {
          type: Object,
          schema: {
            id: String,
            amount: Number,
            unitPrice: Number,
          },
        },
      ],
    },
    location: {
      type: Object,
      required: true,
      schema: {
        lat: Number,
        lng: Number,
      },
    },
    orderDate: { type: Date, required: true },
    deliveryDate: { type: Date, required: false },
  },
  { timestamps: true },
);

export const OrderModel = dynamoose.model<Order & Document>(
  process.env.ORDER_TABLE,
  orderSchema,
);
