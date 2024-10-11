declare global {
    namespace NodeJS {
      interface ProcessEnv {
        //   NODE_ENV: 'development' | 'production';
        JWT_SECRET: string;
        JWT_EXPIRES_IN: string;

        POSTGRES_HOST: string,
        POSTGRES_PORT: string,
        POSTGRES_DB: string,
        POSTGRES_USER: string,
        POSTGRES_PASSWORD: string,

        PIXEL_BUFFER_SIZE: string
        PIXEL_MINUTE_TIMER: string
      }
    }
  }
  
  export {}