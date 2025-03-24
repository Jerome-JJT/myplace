export interface Pixel {
  color_id: number,
  username: string,
  set_time: number
}
export interface PixelNetwork {
  c: number,
  u: string,
  t: number
}
export const PixelFromNetwork = (p: PixelNetwork): Pixel => {
  return {
      color_id: p.c,
      username: p.u,
      set_time: p.t
  }
}

export interface Update extends PixelNetwork {
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
