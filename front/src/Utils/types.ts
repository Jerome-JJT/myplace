export interface Pixel {
    username: string,
    color_id: number,
    set_time: Date
}

export interface Update extends Pixel {
  x: number
  y: number
}

export interface Point {
  x: number,
  y: number
}

export interface ColorType {
    name: string,
    color: string
}

export interface UserInfos {
  id: number
  username: string

  timers: Date[]
  pixel_buffer: number
  pixel_timer: number
}