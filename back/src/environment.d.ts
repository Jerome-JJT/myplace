declare global {
    namespace NodeJS {
      interface ProcessEnv {
        NODE_ENV: string;
        JWT_SECRET: string;
        JWT_EXPIRES_IN: string;

        POSTGRES_HOST: string,
        POSTGRES_PORT: string,
        POSTGRES_DB: string,
        POSTGRES_USER: string,
        POSTGRES_PASSWORD: string,

        PIXEL_BUFFER_SIZE: string
        PIXEL_MINUTE_TIMER: string

        CANVAS_X: string
        CANVAS_Y: string

        REDIS_SPAN_SECONDS: string
        REDIS_MIN_SECONDS: string

        API_UID: string
        API_SECRET: string
        API_CALLBACK: string

        UTC_TIME_START: string
        UTC_TIME_END: string
      }
    }
  }
  
  export {}