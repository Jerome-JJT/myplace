import { Request } from 'express';

export interface UserInfos {
    id: number
    username: string
    soft_is_admin: boolean,
    soft_is_banned: boolean,
    token_seq: number
}
export interface LoggedRequest extends Request {
  user: UserInfos | undefined
}

export interface Color {
    id: number
    name: string
    red: number
    green: number
    blue: number
}

export interface Pixel {
    color_id: number
    username: string
    set_time: number
}
export interface PixelNetwork {
    c: number
    u: string
    t: number
}
export const PixelToNetwork = (p: Pixel): PixelNetwork => {
    return {
        c: p.color_id,
        u: p.username,
        t: p.set_time
    }
}

export interface Update extends PixelNetwork {
    x: number
    y: number
}

