import { Point, Vector } from './types';

export const calcVector = (p1: Point, p2: Point): Vector => {
  const vectorX = p1.x - p2.x;
  const vectorY = p1.y - p2.y;

  return { x: vectorX, y: vectorY } as Vector;
};

export const calcDelta = (v1: Vector, v2: Vector): Vector => {
  const deltaX = v1.x + v2.x;
  const deltaY = v1.y + v1.y;

  return { x: deltaX, y: deltaY } as Point;
};

export const distPoint = (v1: Point, v2: Point): number => {
  return Math.sqrt(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v1.y, 2));
};