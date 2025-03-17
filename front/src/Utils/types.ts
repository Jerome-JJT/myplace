export interface Pixel {
  color_id: number,
  username: string,
  campus_name: string | undefined
  set_time: number
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
  color: string,
  corder: number
}

export interface UserInfos {
  id: number
  username: string
  soft_is_admin: boolean
  soft_is_banned: boolean

  timers: number[]
  pixel_buffer: number
  pixel_timer: number
}

export const QUICK_FIX = { placeholder: '', onPointerEnterCapture: () => {}, onPointerLeaveCapture: () => {} };
