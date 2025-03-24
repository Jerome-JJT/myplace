
export const isTrue = (src: any) => {
    if (src === true || src === 1) {
        return true;
    }
    else if (typeof src === 'string') {
        return src.toLowerCase().includes('true');
    }
    return false;
}

export const DEV_MODE = import.meta.env.VITE_NODE_ENV === 'DEV';

export const MIN_SCALE = 1;
export const MAX_SCALE = 40;

export const CANVAS_MIN_X = parseInt(import.meta.env.VITE_CANVAS_MIN_X!);
export const CANVAS_MIN_Y = parseInt(import.meta.env.VITE_CANVAS_MIN_Y!);
export const CANVAS_MAX_X = parseInt(import.meta.env.VITE_CANVAS_MAX_X!);
export const CANVAS_MAX_Y = parseInt(import.meta.env.VITE_CANVAS_MAX_Y!);
export const CANVAS_SIZE_X = (Math.abs(CANVAS_MIN_X) + Math.abs(CANVAS_MAX_X));
export const CANVAS_SIZE_Y = (Math.abs(CANVAS_MIN_Y) + Math.abs(CANVAS_MAX_Y));

export const ENABLE_GUEST_LOGIN = isTrue(import.meta.env.VITE_ENABLE_GUEST_LOGIN);
export const ENABLE_OAUTH2_LOGIN = isTrue(import.meta.env.VITE_ENABLE_OAUTH2_LOGIN);

export const OAUTH2_DISPLAY_NAME = import.meta.env.VITE_OAUTH2_DISPLAY_NAME;
