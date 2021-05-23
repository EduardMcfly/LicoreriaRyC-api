import { extname } from 'path';
import { PassThrough } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import {
  Resolver,
  Query,
  Mutation,
  Arg,
  InputType,
  Field,
} from 'type-graphql';
import {
  FileUpload,
  GraphQLUpload,
} from '@apollographql/graphql-upload-8-fork';
import { MaxLength, Max, Min } from 'class-validator';
import fetch from 'node-fetch';
import fileType from 'file-type';
import { ObjectType } from 'type-graphql';
import { SortOrder } from 'dynamoose/dist/General';

import { Product, ProductModel } from '@entities';
import { uploadS3 } from '../utils/index';
import { PageInfo } from './common/objectTypes';
import { Pagination } from './common/inputs';
import {
  DocumentRetriever,
  DocumentRetrieverResponse,
} from './common/types';
import { OrderTypes } from '../constants';

@InputType()
class ProductInput {
  @Field()
  @MaxLength(100)
  name!: string;

  @Field({ nullable: true })
  @MaxLength(160)
  description!: string;

  @Field()
  @Min(1)
  @Max(1e8)
  price!: number;

  @Field()
  amount!: number;

  @Field(() => GraphQLUpload, { nullable: true })
  image?: Promise<FileUpload>;

  @Field({ nullable: true })
  imageUrl?: string;
}

@ObjectType()
class ProductConnection {
  @Field(() => [Product])
  data!: Product[];
  @Field(() => PageInfo)
  cursor!: PageInfo;
}

@Resolver(() => Product)
class ProductResolver {
  @Query(() => ProductConnection)
  async products(
    @Arg('category', { nullable: true }) category?: string,
    @Arg('pagination', { nullable: true })
    pagination?: Pagination,
  ): Promise<ProductConnection> {
    const { after, limit = 500, direction = OrderTypes.Asc } = {
      ...pagination,
    };
    let data: DocumentRetrieverResponse<Product>;
    let count: number;

    const getCount = async (
      dr: DocumentRetriever<Product>,
    ): Promise<number> => (await dr.count().exec()).count;

    const exec = (dr: DocumentRetriever<Product>) => {
      if (after)
        dr = dr.startAt({
          id: after,
          ...(category && { category }),
        });
      return dr.limit(limit).exec();
    };

    if (category) {
      const getDr = () => ProductModel.query('category').eq(category);
      count = await getCount(getDr());
      const sort =
        direction === OrderTypes.Asc
          ? SortOrder.ascending
          : SortOrder.descending;

      let dr = getDr().sort(sort);
      data = await exec(dr);
    } else {
      const getDr = () => ProductModel.scan();
      count = await getCount(getDr());
      data = await exec(getDr());
    }
    const { lastKey } = data;
    return {
      data,
      cursor: { count, after: lastKey && lastKey.id },
    };
  }
  @Query(() => Product)
  async product(@Arg('id') id: string) {
    return ProductModel.get(id);
  }
  @Mutation(() => Product)
  async createProduct(
    @Arg('product')
    {
      name,
      description,
      amount,
      price,
      image,
      imageUrl,
    }: ProductInput,
  ) {
    const id = uuidv4();
    let url: string | undefined = undefined;
    if (imageUrl) {
      const file = await fetch(imageUrl).then((res) => res.buffer());
      const ext = (await fileType.fromBuffer(file))?.ext;
      if (ext) {
        url = id + ext;
        await uploadS3({ key: url, file });
      }
    } else if (image) {
      const { filename, createReadStream } = await image;
      const ext = extname(filename);
      url = id + ext;
      const stream = createReadStream();
      const pass = new PassThrough();
      stream.pipe(pass);
      await uploadS3({ key: url, file: pass });
    }

    const product = await ProductModel.create({
      id,
      name,
      description,
      amount,
      price,
      image: url,
      creationDate: new Date(),
    });
    return product;
  }
  @Mutation(() => Product)
  async editProduct(
    @Arg('id') id: string,
    @Arg('product')
    { name, description, amount, price }: ProductInput,
  ) {
    const product = await ProductModel.get(id);
    product.name = name;
    product.description = description;
    product.amount = amount;
    product.price = price;
    await product.save();
    return product;
  }
  @Mutation(() => Boolean)
  async deleteProduct(@Arg('id') id: string) {
    try {
      await ProductModel.delete(id);
      return true;
    } catch (error) {
      return false;
    }
  }
}
export { ProductResolver };
