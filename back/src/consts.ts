

export const PIXEL_BUFFER_SIZE = parseInt(process.env.PIXEL_BUFFER_SIZE!);
export const PIXEL_MINUTE_TIMER = parseInt(process.env.PIXEL_MINUTE_TIMER!);

export const CANVAS_X = parseInt(process.env.CANVAS_X!);
export const CANVAS_Y = parseInt(process.env.CANVAS_Y!);

export const redisTimeout = () => Math.floor(Math.random() * parseInt(process.env.REDIS_SPAN_SECONDS!) + parseInt(process.env.REDIS_MIN_SECONDS!))