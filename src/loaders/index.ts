import { getOne } from './utils';
import { CategoryModel } from '../entities/category';

export const categoryLoader = getOne(CategoryModel);
