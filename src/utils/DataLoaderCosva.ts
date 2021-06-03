import DataLoader, { CacheMap } from 'dataloader';
import LRU, { Options } from 'lru-cache';

export class LruDataLoader<K, V, C = K>
  extends LRU<C, Promise<V>>
  implements CacheMap<C, Promise<V>>
{
  delete: (key: C) => void;
  clear: () => void;
  constructor(props: Options<C, Promise<V>>) {
    super(props);
    this.delete = this.del;
    this.clear = this.reset;
  }
}

class DataLoaderCosva<K, V, C = K> extends DataLoader<K, V, C> {
  constructor(
    batchLoadFn: DataLoader.BatchLoadFn<K, V>,
    options?: DataLoader.Options<K, V, C>,
  ) {
    const defaultOptions: DataLoader.Options<K, V, C> = {
      cache: true,
      cacheMap:
        (!(options && options.cacheMap) &&
          new LruDataLoader<K, V, C>({ maxAge: 15000 })) ||
        undefined,
    };
    super(batchLoadFn, {
      ...defaultOptions,
      ...options,
    });
  }
}
export default DataLoaderCosva;
