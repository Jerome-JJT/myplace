import { Request } from 'express';

export interface UserInfos {
    id: number
    username: string
    soft_is_admin: boolean,
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
    set_time: string
}

export interface Update extends Pixel {
    x: number
    y: number
}

