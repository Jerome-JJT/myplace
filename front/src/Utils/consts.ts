
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

export const CANVAS_X = parseInt(import.meta.env.VITE_CANVAS_X!);
export const CANVAS_Y = parseInt(import.meta.env.VITE_CANVAS_Y!);

export const ENABLE_GUEST_LOGIN = isTrue(import.meta.env.VITE_ENABLE_GUEST_LOGIN);
export const ENABLE_OAUTH2_LOGIN = isTrue(import.meta.env.VITE_ENABLE_OAUTH2_LOGIN);

export const OAUTH2_DISPLAY_NAME = import.meta.env.VITE_OAUTH2_DISPLAY_NAME;
