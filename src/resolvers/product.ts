import {
  FileUpload,
  GraphQLUpload,
} from '@apollographql/graphql-upload-8-fork';
import { Product, ProductModel } from '@entities';
import { Max, MaxLength, Min } from 'class-validator';
import { Document } from 'dynamoose/dist/Document';
import { QueryResponse } from 'dynamoose/dist/DocumentRetriever';
import {
  ObjectType as ObjectTypeDynamoose,
  SortOrder,
} from 'dynamoose/dist/General';
import fileType from 'file-type';
import orderBy from 'lodash/orderBy';
import fetch from 'node-fetch';
import { extname } from 'path';
import { PassThrough } from 'stream';
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  ID,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
} from 'type-graphql';
import { v4 as uuidv4 } from 'uuid';
import { BasicOperators, Condition } from 'dynamoose/dist/Condition';

import { OrderTypes } from '../constants';
import { Category, CategoryModel } from '../entities/category';
import { RequestContext } from '../types';
import { uploadS3 } from '../utils';
import { AfterInput, Pagination } from './common/inputs';
import { After, PageInfo } from './common/objectTypes';
import {
  DocumentRetriever,
  DocumentRetrieverResponse,
} from './common/types';

@InputType()
class ProductInputBase {
  @Field({ nullable: true })
  @MaxLength(160)
  description!: string;

  @Field(() => GraphQLUpload, { nullable: true })
  image?: Promise<FileUpload>;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field({ nullable: true })
  category?: string;
}

@InputType()
class ProductInput extends ProductInputBase {
  @Field()
  @MaxLength(100)
  name!: string;

  @Field()
  @Min(1)
  @Max(1e8)
  price!: number;

  @Field()
  amount!: number;
}

@InputType()
class ProductEditInput extends ProductInputBase {
  @Field({ nullable: true })
  @MaxLength(100)
  name?: string;

  @Field({ nullable: true })
  @Min(1)
  @Max(1e8)
  price?: number;

  @Field({ nullable: true })
  amount?: number;
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
    @Arg('category', () => String, { nullable: true })
    categoryBase: string | undefined,
    @Arg('filter', () => String, { nullable: true })
    filter: string | undefined,
    @Arg('categories', () => [String], { nullable: true })
    categoriesBase: string[] | undefined,
    @Arg('pagination', () => Pagination, { nullable: true })
    pagination: Pagination | undefined,
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
      return dr.limit(limit).all().exec();
    };

    const sort =
      direction === OrderTypes.Asc
        ? SortOrder.ascending
        : SortOrder.descending;

    let lastKey: ObjectTypeDynamoose | undefined;
    const arrayAfter: After[] = [];

    type Filters = BasicOperators<DocumentRetriever<Item> & Filters>;

    const applyFilter = <T extends Filters>(
      dr: T,
      isQuery = false,
    ) => {
      if (filter) {
        const keyCondition: keyof Condition =
          (isQuery && 'beginsWith') || 'contains';
        const name = filter.toLowerCase();
        let newDr = dr.where('name')[keyCondition](name);
        if (!isQuery) newDr = newDr.or();
        if (!categories.length)
          newDr = newDr.where('category.name')[keyCondition](name);
        return newDr;
      }
      return dr;
    };

    if (categories.length) {
      const getDr = async (category: string) => {
        const base = { [key]: { eq: category } };
        if (filter)
          return applyFilter(ProductModel.query({ ...base }), true);
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
        console.log(dataCategory);

        if (dataCategory.lastKey)
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
      const getDr = () => applyFilter(ProductModel.scan());
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

  @Query(() => Product, { nullable: true })
  async product(@Arg('id', () => ID) id: string) {
    return ProductModel.get(id);
  }

  private async uploadImage(
    id: string,
    imageUrl: string | undefined,
    image: Promise<FileUpload> | undefined,
  ) {
    let url: string | undefined;
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
    return url;
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
    const url = await this.uploadImage(id, imageUrl, image);
    let categoryModel: (Category & Document) | undefined;
    if (category) categoryModel = await CategoryModel.get(category);

    const product = await ProductModel.create({
      id,
      name: name.toLowerCase(),
      description,
      amount,
      price,
      image: url,
      category: categoryModel && { ...categoryModel },
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
    {
      name,
      description,
      amount,
      price,
      category,
      image,
      imageUrl,
    }: ProductEditInput,
  ) {
    const product = await ProductModel.get(id);
    if (!product) throw new Error("The product don't exist");
    if (name) product.name = name.toLowerCase();
    if (description) product.description = description;
    if (amount) product.amount = amount;
    if (price) product.price = price;
    if (category) {
      const categoryModel = await CategoryModel.get(category);
      if (categoryModel) {
        product.category = { ...categoryModel };
        product.categoryId = categoryModel.id;
      }
    }
    const url = await this.uploadImage(product.id, imageUrl, image);
    if (url) product.image = url;
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
  async category(
    @Root() product: Product,
    @Ctx() { loaders }: RequestContext,
  ) {
    const { categoryId } = product;
    if (categoryId) return loaders.categoryLoader.load(categoryId);
    return null;
  }
}
export { ProductResolver };
