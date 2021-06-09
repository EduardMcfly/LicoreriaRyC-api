declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    DYNAMODB_TABLE: string;
    CATEGORY_TABLE: string;
    PRODUCT_ORDERS: string;
    BUCKET: string;
    CORS: string;
  }
}
