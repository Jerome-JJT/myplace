import { Request } from 'express';

export interface UserInfos {
    id: number
    username: string
}
export interface LoggedRequest extends Request {
  user: UserInfos
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

