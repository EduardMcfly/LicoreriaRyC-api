import { Document } from 'dynamoose/dist/Document';
import { ModelType } from 'dynamoose/dist/General';

import DataLoaderCosva from '../utils/DataLoaderCosva';
import { LoaderKey } from './types';

type GetOneModel = ModelType<{ id: string | number } & Document>;

export const getOne = <
  O extends GetOneModel,
  I extends InstanceType<O>,
>(
  model: O,
) =>
  new DataLoaderCosva(async (keys: readonly LoaderKey[]) => {
    const records = (await Promise.all(
      keys.map((key) => model.get(`${key}`)),
    )) as I[];
    return keys.map((key) =>
      records.find((record) => record.id === key),
    );
  });
