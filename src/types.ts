import { Context } from 'aws-lambda';

import * as loaders from './loaders';

export interface RequestContext extends Context {
  loaders: typeof loaders;
}
