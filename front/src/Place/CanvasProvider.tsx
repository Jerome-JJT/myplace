import { useRef, useState, useEffect, useCallback } from 'react';
import { useContext, type ReactNode, createContext } from 'react';
import axios from 'axios';

import { objUrlEncode } from 'src/Utils/objUrlEncode';
import { MIN_SCALE, MAX_SCALE, CANVAS_X, CANVAS_Y } from 'src/Utils/consts';
import { ColorType, Pixel, Point } from 'src/Utils/types';
import { useNotification } from 'src/NotificationProvider';
import { distPoint } from 'src/Utils/mymaths';

interface CanvasContextProps {
  pl: React.MutableRefObject<HTMLCanvasElement | null>,

  queryPlace: (time: string | undefined, cb: (() => any) | undefined) => void,

  activePixel: Point,
  setActivePixel: React.Dispatch<React.SetStateAction<Point>>,
  activeColor: number,
  setActiveColor: React.Dispatch<React.SetStateAction<number>>,

  colors: Map<number, ColorType>,
  board: Map<string, Pixel>,
  setBoard: React.Dispatch<React.SetStateAction<Map<string, Pixel>>>,

  activeTime: number,
  setActiveTime: React.Dispatch<React.SetStateAction<number>>,
  times: { min: number, max: number } | undefined,

  scale: number,
  setScale: React.Dispatch<React.SetStateAction<number>>,
  translate: Point,

  overlayStyle: {
    width: string;
    height: string;
    top: string;
    left: string;
  },

  setIsDragging: React.Dispatch<React.SetStateAction<number>>,

  doZoom: (pageX: number, pageY: number, newScale: number) => void,
  canvasCursorDown: (identifier: number, pageX: number, pageY: number) => void,
  canvasCursorMove: (identifier: number, pageX: number, pageY: number) => void,
  canvasCursorUp: (identifier: number, pageX: number, pageY: number) => void,
  canvasZoomed: (pageX: number, pageY: number, deltaY: number) => void,
  canvasClicked: (pageX: number, pageY: number) => void,

  canvasTouchMove: (touch1: React.Touch, touch2: React.Touch) => void,
  canvasTouchUp: () => void,
}

const CanvasContext = createContext<CanvasContextProps | undefined>(undefined);

export function useCanvas(): CanvasContextProps {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
}

export const baseScale = Math.round(Math.max(Math.min(1 / ((CANVAS_X + CANVAS_Y) / 2) * 800, MAX_SCALE), MIN_SCALE));

export function CanvasProvider({ children }: { children: ReactNode }): JSX.Element {
  const { addNotif } = useNotification();
  const pl = useRef<HTMLCanvasElement | null>(null);

  const [activePixel, setActivePixel] = useState<Point>({ x: -1, y: -1 });
  const [activeColor, setActiveColor] = useState(-1);

  const [colors, setColors] = useState<Map<number, ColorType>>(new Map());
  const [board, setBoard] = useState<Map<string, Pixel>>(new Map());

  const [activeTime, setActiveTime] = useState(-1);
  const [times, setTimes] = useState<{ min: number, max: number } | undefined>(undefined);

  const [scale, setScale] = useState(baseScale);
  const [translate, setTranslate] = useState<Point>({ x: 0, y: 0 });
  const [overlayStyle, setOverlayStyle] = useState({
    width:  `${scale - 2}px`,
    height: `${scale - 2}px`,
    top:    '0px',
    left:   '0px',
  });

  const [dragIdentifier, setDragIdentifier] = useState<number | undefined>(undefined);
  const [dragStart, setDragStart] = useState<Point>({ x: -1, y: -1 });
  const [isDragging, setIsDragging] = useState(0);

  // const [superDragStartMouse, setSuperDragStartMouse] = useState<[Point, Point]>([{ x: -1, y: -1 }, { x: -1, y: -1 }]);
  const [superDragStartScreen, setSuperDragStartScreen] = useState<[Point, Point]>([{ x: -1, y: -1 }, { x: -1, y: -1 }]);
  const [superScale, setSuperScale] = useState(0);
  const [isSuperDragging, setIsSuperDragging] = useState(0);

  const queryPlace = useCallback((time: string | undefined, cb: (() => any) | undefined) => {
    const params = new URLSearchParams(window.location.search);
    const baseX = parseInt(params.get('x') || '');
    const baseY = parseInt(params.get('y') || '');
    const scale = parseInt(params.get('scale') || '');

    if (pl.current !== null) {
      const centerX = pl.current.width / 2;
      const centerY = pl.current.height / 2;
      const ctx = pl.current.getContext('2d');

      if (ctx !== null) {

        const args = objUrlEncode({
          'time': time,
        });

        axios
          .get(`/api/get${args.length > 0 ? `?${args}` : ''}`,
            { withCredentials: true },
          )
          .then((res) => {
            if (res.status === 200) {

              const cols = new Map();
              res.data.colors?.forEach((c: any) => {
                cols.set(c['id'], {
                  name:  c['name'],
                  color: `${c['red']}, ${c['green']}, ${c['blue']}`,
                });
              });
              setColors(cols);

              const pixs = new Map();
              (res.data.board as Pixel[][]).forEach((column, x) => {
                column.forEach((pixel, y) => {
                  ctx.fillStyle = 'rgb(' + cols.get(pixel.color_id).color + ')';
                  ctx.fillRect(x, y, 1, 1);
                  pixs.set(`${x}:${y}`, pixel);
                });
              });
              setBoard(pixs);

              if (res.data.min_time !== undefined && res.data.max_time !== undefined) {
                setTimes({ min: res.data.min_time, max: res.data.max_time });
                setActiveTime((prev) => {
                  if (prev < res.data.min_time || prev > res.data.max_time) {
                    return res.data.max_time;
                  }
                  else {
                    return prev;
                  }
                });
              }
              else {
                setTimes(undefined);
              }

              if (!Number.isNaN(baseX) && !Number.isNaN(baseY)) {
                const setX = Math.max(Math.min(baseX, CANVAS_X - 1), 0);
                const setY = Math.max(Math.min(baseY, CANVAS_Y - 1), 0);

                setActivePixel({ x: setX, y: setY });
                setScale(Number.isNaN(scale) ? Math.floor(((MIN_SCALE + MAX_SCALE) / 2 + MAX_SCALE) / 2) : scale);
                setTranslate({ x: centerX - setX, y: centerY - setY });
              }
            }
            if (cb) {
              cb();
            }
          })
          .catch((error) => {
            console.log('is too soon', error);
            if (error.response === undefined || error.response.status === 502) {
              addNotif('Too soon, server not ready, reload in 2 sec', 'info');
            }
            if (cb) {
              cb();
            }
          });
      }
    }
  }, [addNotif]);


  useEffect(() => {
    if (pl.current !== null) {

      const centerX = pl.current.width / 2;
      const centerY = pl.current.height / 2;

      const trueOffsetX = pl.current.offsetLeft - centerX * scale;
      const trueOffsetY = pl.current.offsetTop - centerY * scale;

      const offsetX = trueOffsetX;
      const offsetY = trueOffsetY;

      const tx = (activePixel.x + translate.x) * scale + centerX + offsetX;
      const ty = (activePixel.y + translate.y) * scale + centerY + offsetY;

      setOverlayStyle((prev) => {
        return {
          ...prev,
          width:  `${scale - 2}px`,
          height: `${scale - 2}px`,

          top:  ty + 'px',
          left: tx + 'px',
        };
      });
    }
  }, [pl.current?.offsetLeft, pl.current?.offsetTop, scale, activePixel.x, activePixel.y, translate.x, translate.y, isDragging]);

  const [_windowSize, setWindowSize] = useState<{width: number| undefined, height: number | undefined}>({
    width:  undefined,
    height: undefined,
  });
  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width:  window.innerWidth,
        height: window.innerHeight,
      });
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const doZoom = useCallback((pageX: number, pageY: number, newScale: number) => {
    if (pl.current !== null) {

      const centerX = pl.current.width / 2;
      const centerY = pl.current.height / 2;

      const offsetX = pl.current.offsetLeft + ((translate.x) * scale * 2);
      const offsetY = pl.current.offsetTop + ((translate.y) * scale * 2);

      const mouseX = ((pageX - offsetX) - centerX) / scale;
      const mouseY = ((pageY - offsetY) - centerY) / scale;

      setTranslate((prev) => ({
        x: ((mouseX + prev.x * 2) * (scale / newScale)) - (mouseX + translate.x),
        y: ((mouseY + prev.y * 2) * (scale / newScale)) - (mouseY + translate.y),
      }));

      setScale(newScale);
    }
  }, [scale, translate.x, translate.y]);


  const canvasClicked = useCallback((pageX: number, pageY: number) => {
    if (pl.current !== null) {

      const centerX = pl.current.width / 2;
      const centerY = pl.current.height / 2;

      const offsetX = pl.current.offsetLeft + (translate.x - centerX) * scale;
      const offsetY = pl.current.offsetTop + (translate.y - centerY) * scale;

      const mouseX = ((pageX - offsetX) - centerX) / scale;
      const mouseY = ((pageY - offsetY) - centerY) / scale;


      const clickedX = Math.floor(mouseX);
      const clickedY = Math.floor(mouseY);

      if (clickedX < CANVAS_X && clickedY < CANVAS_Y) {
        setActivePixel({ x: clickedX, y: clickedY });

        const params = new URLSearchParams(window.location.search);
        const args = objUrlEncode({
          ...Object.fromEntries(params),
          'x':     Math.min(Math.max(clickedX, 0), CANVAS_X),
          'y':     Math.min(Math.max(clickedY, 0), CANVAS_Y),
          'scale': scale,
        });

        const base = `${window.location.origin}${window.location.pathname}`;
        const link = `${base}?${args}`;
        window.history.replaceState(null, '', link);
      }
      else {
        setActivePixel({ x: -1, y: -1 });
      }
    }
  }, [scale, translate.x, translate.y]);


  const canvasZoomed = useCallback((pageX: number, pageY: number, deltaY: number) => {
    const factor = Math.sign(deltaY) > 0 ? 0.9 : 1.1;
    const testScale = Math.round(factor > 1 ? Math.max(scale * factor, scale + 1) : Math.min(scale * factor, scale - 1));
    const newScale = Math.round(Math.min(Math.max(testScale, MIN_SCALE), MAX_SCALE));

    doZoom(pageX, pageY, newScale);

  }, [doZoom, scale]);


  const canvasCursorDown = useCallback((identifier: number, pageX: number, pageY: number) => {
    if (pl.current !== null) {

      const centerX = pl.current.width / 2;
      const centerY = pl.current.height / 2;

      const offsetX = pl.current.offsetLeft + (translate.x - centerX) * scale;
      const offsetY = pl.current.offsetTop + (translate.y - centerY) * scale;

      const mouseX = ((pageX - offsetX) - centerX) / scale;
      const mouseY = ((pageY - offsetY) - centerY) / scale;

      setDragStart({ x: mouseX, y: mouseY });
      setDragIdentifier(identifier);
      setIsDragging(1);
    }
  }, [scale, translate.x, translate.y]);


  const canvasCursorMove = useCallback((identifier: number, pageX: number, pageY: number) => {
    if (pl.current !== null) {
      if (isDragging >= 1 && identifier === dragIdentifier) {
        const centerX = pl.current.width / 2;
        const centerY = pl.current.height / 2;

        const offsetX = pl.current.offsetLeft + (translate.x - centerX) * scale;
        const offsetY = pl.current.offsetTop + (translate.y - centerY) * scale;

        const mouseX = ((pageX - offsetX) - centerX) / scale;
        const mouseY = ((pageY - offsetY) - centerY) / scale;

        setTranslate((prev) => {
          return {
            x: prev.x - (dragStart.x - mouseX),
            y: prev.y - (dragStart.y - mouseY),
          };
        });

        setIsDragging((prev) => Math.min(10, prev + 1));
      }
      else if (identifier >= 0) { //relloc touch but not mouse
        canvasCursorDown(identifier, pageX, pageY);
      }
    }
  }, [canvasCursorDown, dragIdentifier, dragStart.x, dragStart.y, isDragging, scale, translate.x, translate.y]);


  const canvasCursorUp = useCallback((_identifier: number, pageX: number, pageY: number) => {
    if (isDragging <= 2) {
      canvasClicked(pageX, pageY);
    }
    setIsDragging(0);
    setDragIdentifier(undefined);
  }, [canvasClicked, isDragging]);


  const canvasTouchDown = useCallback((touch1: React.Touch, touch2: React.Touch) => {
    if (pl.current !== null) {

      // const centerX = pl.current.width / 2;
      // const centerY = pl.current.height / 2;

      // const offsetX = pl.current.offsetLeft + (translate.x - centerX) * scale;
      // const offsetY = pl.current.offsetTop + (translate.y - centerY) * scale;

      // const mouse1 = {
      //   x: ((touch1.pageX - offsetX) - centerX) / scale,
      //   y: ((touch1.pageY - offsetY) - centerY) / scale,
      // };
      // const mouse2 = {
      //   x: ((touch2.pageX - offsetX) - centerX) / scale,
      //   y: ((touch2.pageY - offsetY) - centerY) / scale,
      // };
      // setSuperDragStartMouse([mouse1, mouse2]);

      setSuperDragStartScreen([{ x: touch1.screenX, y: touch1.screenY }, { x: touch2.screenX, y: touch2.screenY } ]);
      setIsSuperDragging(1);
      setSuperScale(scale);
    }
  }, [scale]);



  const canvasTouchMove = useCallback((touch1: React.Touch, touch2: React.Touch) => {
    if (pl.current !== null) {
      if (isSuperDragging >= 1) {
        const pageAvg = {
          x: (touch1.pageX + touch2.pageX) / 2,
          y: (touch1.pageY + touch2.pageY) / 2,
        };
        const screen1 = {
          x: touch1.screenX,
          y: touch1.screenY,
        };
        const screen2 = {
          x: touch2.screenX,
          y: touch2.screenY,
        };

        const totDist = (distPoint(screen1, screen2) - distPoint(superDragStartScreen[0], superDragStartScreen[1])) / 4;
        const newScale = Math.round(Math.min(Math.max(superScale + totDist, MIN_SCALE), MAX_SCALE));
        doZoom(pageAvg.x, pageAvg.y, newScale);

        // const centerX = pl.current.width / 2;
        // const centerY = pl.current.height / 2;
        // const offsetX = pl.current.offsetLeft + (translate.x - centerX) * scale;
        // const offsetY = pl.current.offsetTop + (translate.y - centerY) * scale;
        // const mouse1 = {
        //   x: ((touch1.pageX - offsetX) - centerX) / scale,
        //   y: ((touch1.pageY - offsetY) - centerY) / scale,
        // };
        // const mouse2 = {
        //   x: ((touch2.pageX - offsetX) - centerX) / scale,
        //   y: ((touch2.pageY - offsetY) - centerY) / scale,
        // };
        // const moved = calcDelta(calcVector(mouse1, superDragStartMouse[0]), calcVector(mouse2, superDragStartMouse[1]));
        // setTranslate((prev) => {
        //   return {
        //     x: prev.x + moved.x / 10,
        //     y: prev.y + moved.y / 10,
        //   };
        // });

        setIsSuperDragging((prev) => Math.min(10, prev + 1));
      }
      else {
        canvasTouchDown(touch1, touch2);
      }
    }
  }, [canvasTouchDown, doZoom, isSuperDragging, superDragStartScreen, superScale]);


  const canvasTouchUp = useCallback(() => {
    setIsSuperDragging(0);
  }, []);

  return (
    <CanvasContext.Provider
      value={{
        pl,

        queryPlace,

        activePixel,
        setActivePixel,
        activeColor,
        setActiveColor,

        colors,
        board,
        setBoard,

        activeTime,
        setActiveTime,
        times,

        scale,
        setScale,
        translate,
        overlayStyle,

        setIsDragging,

        doZoom,
        canvasCursorDown,
        canvasCursorMove,
        canvasCursorUp,
        canvasZoomed,
        canvasClicked,

        canvasTouchMove,
        canvasTouchUp,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
}
