import { Context } from 'aws-lambda';

import * as loaders from './loaders';
import * as entities from './entities';

export interface RequestContext extends Context {
  loaders: typeof loaders;
  entities: typeof entities;
}
