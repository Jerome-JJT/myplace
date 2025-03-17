
export const isTrue = (src: any) => {
    if (src === true || src === 1) {
        return true;
    }
    else if (typeof src === 'string') {
        return src.toLowerCase().includes('true');
    }
    return false;
}

export const DEV_MODE = process.env.NODE_ENV === 'DEV';

export const CANVAS_X = parseInt(process.env.CANVAS_X!);
export const CANVAS_Y = parseInt(process.env.CANVAS_Y!);

export const PIXEL_BUFFER_SIZE = parseInt(process.env.PIXEL_BUFFER_SIZE!);
export const PIXEL_MINUTE_TIMER = parseInt(process.env.PIXEL_MINUTE_TIMER!);

export const UTC_TIME_START = (new Date(process.env.UTC_TIME_START!)).getTime();
export const UTC_TIME_END = (new Date(process.env.UTC_TIME_END!)).getTime();

export const POSTGRES_HOST = process.env.POSTGRES_HOST!;
export const POSTGRES_PORT = parseInt(process.env.POSTGRES_PORT!);
export const POSTGRES_DB = process.env.POSTGRES_DB!;
export const POSTGRES_USER = process.env.POSTGRES_USER!;
export const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD!;

export const REDIS_HOST = process.env.REDIS_HOST!;
export const REDIS_PORT = parseInt(process.env.REDIS_PORT!);
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD!;

export const REDIS_SPAN_SECONDS = parseInt(process.env.REDIS_SPAN_SECONDS!);
export const REDIS_MIN_SECONDS = parseInt(process.env.REDIS_MIN_SECONDS!);
export const redisTimeout = () => Math.floor(Math.random() * parseInt(process.env.REDIS_SPAN_SECONDS!) + parseInt(process.env.REDIS_MIN_SECONDS!));

export const JWT_SECRET = process.env.JWT_SECRET!;
export const JWT_EXPIRES_IN = parseInt(process.env.JWT_EXPIRES_IN!);
export const JWT_REFRESH_EXPIRES_IN = parseInt(process.env.JWT_REFRESH_EXPIRES_IN!);

export const ENABLE_GUEST_LOGIN = isTrue(process.env.ENABLE_GUEST_LOGIN);

export const ENABLE_OAUTH2_LOGIN = isTrue(process.env.ENABLE_OAUTH2_LOGIN);
export const OAUTH2_UID = ENABLE_OAUTH2_LOGIN ? process.env.OAUTH2_UID! : undefined;
export const OAUTH2_SECRET = ENABLE_OAUTH2_LOGIN ? process.env.OAUTH2_SECRET! : undefined;

export const OAUTH2_AUTHORIZE_URL = ENABLE_OAUTH2_LOGIN ? process.env.OAUTH2_AUTHORIZE_URL! : undefined;
export const OAUTH2_TOKEN_URL = ENABLE_OAUTH2_LOGIN ? process.env.OAUTH2_TOKEN_URL! : undefined;
export const OAUTH2_CALLBACK_URL = ENABLE_OAUTH2_LOGIN ? process.env.OAUTH2_CALLBACK_URL! : undefined;
export const OAUTH2_INFO_URL = ENABLE_OAUTH2_LOGIN ? process.env.OAUTH2_INFO_URL! : undefined;

export const OAUTH2_ID_FIELD = ENABLE_OAUTH2_LOGIN ? process.env.OAUTH2_ID_FIELD! : undefined;
export const OAUTH2_USERNAME_FIELD = ENABLE_OAUTH2_LOGIN ? process.env.OAUTH2_USERNAME_FIELD! : undefined;
export const OAUTH2_EMAIL_FIELD = ENABLE_OAUTH2_LOGIN ? process.env.OAUTH2_EMAIL_FIELD! : undefined;
