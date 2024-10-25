export interface Pixel {
    username: string,
    color_id: number,
    set_time: string
}

export interface Update extends Pixel {
  x: number
  y: number
}

export interface Point {
  x: number,
  y: number
}

export type Vector = Point;


export interface ColorType {
    name: string,
    color: string
}

export interface UserInfos {
  id: number
  username: string
  soft_is_admin: boolean
  soft_is_banned: boolean

  timers: string[]
  pixel_buffer: number
  pixel_timer: number
}

export const QUICK_FIX = { placeholder: '', onPointerEnterCapture: () => {}, onPointerLeaveCapture: () => {} };
