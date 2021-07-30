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
  FieldResolver,
  Root,
} from 'type-graphql';
import {
  FileUpload,
  GraphQLUpload,
} from '@apollographql/graphql-upload-8-fork';
import { MaxLength } from 'class-validator';
import fetch from 'node-fetch';
import { fromBuffer } from 'file-type';

import { Category, CategoryModel } from '@entities';
import { uploadS3 } from '../utils/index';
import { Product, ProductModel } from '../entities/product';

@InputType()
class CategoryInput {
  @Field()
  @MaxLength(100)
  name!: string;

  @Field({ nullable: true })
  @MaxLength(160)
  description!: string;

  @Field(() => GraphQLUpload, { nullable: true })
  image?: Promise<FileUpload>;

  @Field({ nullable: true })
  imageUrl?: string;
}

@Resolver(() => Category)
class CategoryResolver {
  @Query(() => [Category])
  async categories(): Promise<Category[]> {
    const categories = await CategoryModel.scan().exec();
    return categories;
  }

  @Query(() => Category)
  async category(@Arg('id') id: string) {
    return CategoryModel.get(id);
  }

  @Mutation(() => Category)
  async createCategory(
    @Arg('category')
    { name, description, image, imageUrl }: CategoryInput,
  ) {
    const id = uuidv4();
    let url: string | undefined = undefined;
    if (imageUrl) {
      const file = await fetch(imageUrl).then((res) => res.buffer());
      const ext = (await fromBuffer(file))?.ext;
      if (ext) {
        url = id + '.' + ext;
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
    const product = await CategoryModel.create({
      id,
      name,
      description,
      image: url,
    });
    return product;
  }

  @Mutation(() => [Category])
  async createCategories(
    @Arg('categories', () => [CategoryInput])
    categories: CategoryInput[],
  ) {
    return categories.map((product) => this.createCategory(product));
  }

  @Mutation(() => Category)
  async editCategory(
    @Arg('id') id: string,
    @Arg('product')
    { name, description }: CategoryInput,
  ) {
    const category = await CategoryModel.get(id);
    category.name = name;
    category.description = description;
    await category.save();
    return category;
  }

  @Mutation(() => Boolean)
  async deleteCategory(@Arg('id') id: string) {
    try {
      await CategoryModel.delete(id);
      return true;
    } catch (error) {
      return false;
    }
  }

  @FieldResolver(() => [Product], { nullable: true })
  async products(@Root() category: Category) {
    const products = await ProductModel.query('categoryId')
      .eq(category.id)
      .exec();
    console.log(products);

    return products;
  }
}
export { CategoryResolver };
