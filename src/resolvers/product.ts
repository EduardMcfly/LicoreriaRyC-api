import { extname } from 'path';
import { PassThrough } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import orderBy from 'lodash/orderBy';
import {
  Resolver,
  Query,
  Mutation,
  Arg,
  InputType,
  Field,
  FieldResolver,
  Root,
  ObjectType,
  Ctx,
} from 'type-graphql';
import {
  FileUpload,
  GraphQLUpload,
} from '@apollographql/graphql-upload-8-fork';
import { MaxLength, Max, Min } from 'class-validator';
import fetch from 'node-fetch';
import fileType from 'file-type';
import {
  ObjectType as ObjectTypeDynamoose,
  SortOrder,
} from 'dynamoose/dist/General';
import { Document } from 'dynamoose/dist/Document';
import { QueryResponse } from 'dynamoose/dist/DocumentRetriever';

import { Product, ProductModel } from '@entities';
import { PageInfo, After } from './common/objectTypes';
import { AfterInput, Pagination } from './common/inputs';
import {
  DocumentRetriever,
  DocumentRetrieverResponse,
} from './common/types';
import { OrderTypes } from '../constants';
import { uploadS3 } from '../utils';
import { Category, CategoryModel } from '../entities/category';
import { RequestContext } from '../types';

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

  @Field({ nullable: true })
  category?: string;
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
    @Arg('category', { nullable: true }) categoryBase?: string,
    @Arg('filter', { nullable: true }) filter?: string,
    @Arg('categories', () => [String], { nullable: true })
    categoriesBase?: string[],
    @Arg('pagination', { nullable: true })
    pagination?: Pagination,
  ): Promise<ProductConnection> {
    const {
      after,
      arrayAfter: arrayAfterInput = [],
      limit = 500,
      direction = OrderTypes.Asc,
    } = {
      ...pagination,
    };

    const key = 'categoryId';

    const categories: string[] = [];
    if (categoriesBase instanceof Array)
      categories.push(...categoriesBase);
    const afterInputOne =
      (after && {
        id: after,
      }) ||
      undefined;
    if (afterInputOne)
      arrayAfterInput.push({
        ...afterInputOne,
        ...(categoryBase && { [key]: categoryBase }),
      });
    if (categoryBase) categories.push(categoryBase);

    type Item = Product & Document;
    type Data = DocumentRetrieverResponse<Item>;

    let data: Item[];
    let count: number;

    const getCount = async (
      dr: DocumentRetriever<Item>,
    ): Promise<number> => (await dr.count().exec()).count;

    const exec = (
      dr: DocumentRetriever<Item>,
      afterInput?: AfterInput,
    ): Promise<QueryResponse<Item>> => {
      if (afterInput) dr = dr.startAt(afterInput);
      return dr.limit(limit).exec();
    };

    const sort =
      direction === OrderTypes.Asc
        ? SortOrder.ascending
        : SortOrder.descending;

    let lastKey: ObjectTypeDynamoose | undefined;
    const arrayAfter: (After | undefined)[] = [];

    const filterObj = filter
      ? { name: { beginsWith: filter.toLowerCase() } }
      : undefined;

    if (categories.length) {
      const getDr = async (category: string) => {
        const base = { [key]: { eq: category } };
        if (filterObj)
          return ProductModel.query({ ...base, ...filterObj });
        return ProductModel.query(base).sort(sort);
      };
      count = 0;
      const dataCategories: Data[] = [];
      for (const category of categories) {
        count += await getCount(await getDr(category));
        const dr = await getDr(category);
        const afterInput = arrayAfterInput.find(
          (obj) => obj[key] === category,
        );
        const dataCategory = await exec(dr, afterInput);
        arrayAfter.push(dataCategory.lastKey);
        dataCategories.push(dataCategory);
      }
      const array = dataCategories.reduce((p, c) => {
        if (!p) return c;
        p.push(...c);
        return p;
      });
      lastKey = array.lastKey;

      data = orderBy(
        array,
        ['name'],
        [sort === SortOrder.ascending ? 'asc' : 'desc'],
      );
    } else {
      const getDr = () => ProductModel.scan(filterObj);
      count = await getCount(getDr());
      const array = await exec(getDr(), afterInputOne);
      data = array;
      lastKey = array.lastKey;
    }

    return {
      data,
      cursor: { count, after: lastKey && lastKey.id, arrayAfter },
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
      category,
    }: ProductInput,
  ) {
    const id = uuidv4();
    let url: string | undefined = undefined;
    if (imageUrl) {
      const file = await fetch(imageUrl).then((res) => res.buffer());
      const ext = (await fileType.fromBuffer(file))?.ext;
      if (ext) {
        url = id + '.' + ext;
        await uploadS3({ key: url, file });
      }
    } else if (image) {
      const { filename, createReadStream } = await image;
      const ext = extname(filename);
      url = id + '.' + ext;
      const stream = createReadStream();
      const pass = new PassThrough();
      stream.pipe(pass);
      await uploadS3({ key: url, file: pass });
    }
    let categoryModel: (Category & Document) | undefined;
    if (category) categoryModel = await CategoryModel.get(category);

    const product = await ProductModel.create({
      id,
      name: name.toLowerCase(),
      description,
      amount,
      price,
      image: url,
      categoryId: categoryModel?.id,
      creationDate: new Date(),
    });
    return product;
  }

  @Mutation(() => [Product])
  async createProducts(
    @Arg('products', () => [ProductInput]) products: ProductInput[],
  ) {
    return products.map((product) => this.createProduct(product));
  }

  @Mutation(() => Product)
  async editProduct(
    @Arg('id') id: string,
    @Arg('product')
    { name, description, amount, price, category }: ProductInput,
  ) {
    const product = await ProductModel.get(id);
    product.name = name.toLowerCase();
    product.description = description;
    product.amount = amount;
    product.price = price;
    let categoryModel: Category | undefined;
    if (category) categoryModel = await CategoryModel.get(category);
    product.categoryId = categoryModel?.id;
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

  @FieldResolver(() => Category, { nullable: true })
  category(@Root() product: Product) {
    return product.category;
  }
}
export { ProductResolver };
