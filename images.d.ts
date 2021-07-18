declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    DYNAMODB_TABLE: string;
    CATEGORY_TABLE: string;
    ORDER_TABLE: string;
    BUCKET: string;
    CORS: string;
    APP_URL: string;
    TWILIO_ACCOUNT_SID: string;
    TWILIO_AUTH_TOKEN: string;
    TWILIO_NUMBER: string;
    DOMICILIARY_NUMBER: string;
  }
}
