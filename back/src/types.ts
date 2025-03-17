import { Request } from 'express';

export interface UserInfos {
    id: number
    username: string
    soft_is_admin: boolean,
    soft_is_banned: boolean,
    token_seq: number,
    campus_name: string
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
    campus_name: string | undefined
    set_time: number
}

export interface Update extends Pixel {
    x: number
    y: number
}

