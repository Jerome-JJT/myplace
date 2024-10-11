import { useRef, useState, useEffect, useCallback } from 'react';
import { useContext, type ReactNode, createContext } from 'react';
import axios from 'axios';

import { objUrlEncode } from 'src/Utils/objUrlEncode';
import { MIN_SCALE, MAX_SCALE, CANVAS_X, CANVAS_Y } from 'src/Utils/consts';
import { ColorType, Pixel, Point } from 'src/Utils/types';

interface CanvasContextProps {
  pl: React.MutableRefObject<HTMLCanvasElement | null>

  activePixel : Point,
  setActivePixel: React.Dispatch<React.SetStateAction<Point>>,
  activeColor: number,
  setActiveColor: React.Dispatch<React.SetStateAction<number>>,

  colors: Map<number, ColorType>
  board: Map<string, Pixel>
  setBoard: React.Dispatch<React.SetStateAction<Map<string, Pixel>>>

  scale: number,
  setScale: React.Dispatch<React.SetStateAction<number>>,
  translate: Point

  overlayStyle: {
    width: string;
    height: string;
    top: string;
    left: string;
  }

  setIsDragging: React.Dispatch<React.SetStateAction<number>>,

  doZoom: (pageX: number, pageY: number, newScale: number) => void
  canvasMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void,
  canvasMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void,
  canvasMouseUp: (e: React.MouseEvent<HTMLCanvasElement>) => void,
  canvasZoomed: (e: React.WheelEvent<HTMLCanvasElement>) => void,
}

const CanvasContext = createContext<CanvasContextProps | undefined>(undefined);

export function useCanvas(): CanvasContextProps {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
}

export function CanvasProvider({ children }: { children: ReactNode }): JSX.Element {
  const pl = useRef<HTMLCanvasElement | null>(null);

  const [activePixel, setActivePixel] = useState<Point>({ x: -1, y: -1 });
  const [activeColor, setActiveColor] = useState(-1);

  const [colors, setColors] = useState<Map<number, ColorType>>(new Map());
  const [board, setBoard] = useState<Map<string, Pixel>>(new Map());

  const [scale, setScale] = useState(MIN_SCALE);
  const [translate, setTranslate] = useState<Point>({ x: 0, y: 0 });
  const [overlayStyle, setOverlayStyle] = useState({
    width:  `${scale - 2}px`,
    height: `${scale - 2}px`,
    top:    '0px',
    left:   '0px',
  });

  const [dragStart, setDragStart] = useState<Point>({ x: -1, y: -1 });
  const [isDragging, setIsDragging] = useState(0);

  useEffect(() => {
    if (pl.current !== null) {
      const centerX = pl.current.width / 2;
      const centerY = pl.current.height / 2;
      const ctx = pl.current.getContext('2d');

      if (ctx !== null) {
        axios
          .get('/api/get',
            { withCredentials: true },
          )
          .then((res) => {
            if (res.status === 200) {

              const cols = new Map();
              res.data.colors.forEach((c: any) => {
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

              const params = new URLSearchParams(window.location.search);
              const baseX = parseInt(params.get('x') || '');
              const baseY = parseInt(params.get('y') || '');
              const scale = parseInt(params.get('scale') || '');

              if (!Number.isNaN(baseX) && !Number.isNaN(baseY)) {
                setActivePixel({ x: baseX, y: baseY });
                setScale(Number.isNaN(scale) ? Math.floor(((MIN_SCALE + MAX_SCALE) / 2 + MAX_SCALE) / 2 ) : scale);
                setTranslate({ x: centerX - baseX, y: centerY - baseY });
              }
            }
          })
          .catch(() => {
          });
      }
    }
  }, []);


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


  const canvasClicked = useCallback((e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (pl.current !== null) {

      const centerX = pl.current.width / 2;
      const centerY = pl.current.height / 2;

      const offsetX = pl.current.offsetLeft + (translate.x - centerX) * scale;
      const offsetY = pl.current.offsetTop + (translate.y - centerY) * scale;

      const mouseX = ((e.pageX - offsetX) - centerX) / scale;
      const mouseY = ((e.pageY - offsetY) - centerY) / scale;


      const clickedX = Math.floor(mouseX);
      const clickedY = Math.floor(mouseY);

      if (clickedX < CANVAS_X && clickedY < CANVAS_Y) {
        setActivePixel({ x: clickedX, y: clickedY });

        const args = objUrlEncode({
          'x':     clickedX,
          'y':     clickedY,
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


  const canvasZoomed = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.stopPropagation();

    const factor = Math.sign(e.deltaY) > 0 ? 0.9 : 1.1;
    const newScale = Math.round(Math.min(Math.max(scale * factor, MIN_SCALE), MAX_SCALE));

    doZoom(e.pageX, e.pageY, newScale);

  }, [doZoom, scale]);


  const canvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (pl.current !== null) {

      const centerX = pl.current.width / 2;
      const centerY = pl.current.height / 2;

      const offsetX = pl.current.offsetLeft + (translate.x - centerX) * scale;
      const offsetY = pl.current.offsetTop + (translate.y - centerY) * scale;

      const mouseX = ((e.pageX - offsetX) - centerX) / scale;
      const mouseY = ((e.pageY - offsetY) - centerY) / scale;

      setDragStart({ x: mouseX, y: mouseY });
      setIsDragging(1);
    }
  }, [scale, translate.x, translate.y]);


  const canvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (pl.current !== null && isDragging >= 1) {

      const centerX = pl.current.width / 2;
      const centerY = pl.current.height / 2;

      const offsetX = pl.current.offsetLeft + (translate.x - centerX) * scale;
      const offsetY = pl.current.offsetTop + (translate.y - centerY) * scale;

      const mouseX = ((e.pageX - offsetX) - centerX) / scale;
      const mouseY = ((e.pageY - offsetY) - centerY) / scale;

      setTranslate((prev) => {
        return {
          x: prev.x - (dragStart.x - mouseX),
          y: prev.y - (dragStart.y - mouseY),
        };
      });

      if (isDragging <= 10) {
        setIsDragging((prev) => prev + 1);
      }
    }
  }, [dragStart.x, dragStart.y, isDragging, scale, translate.x, translate.y]);


  const canvasMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging <= 2) {
      canvasClicked(e);
    }
    setIsDragging(0);
  }, [canvasClicked, isDragging]);


  return (
    <CanvasContext.Provider
      value={{
        pl,

        activePixel,
        setActivePixel,
        activeColor,
        setActiveColor,

        colors,
        board,
        setBoard,

        scale,
        setScale,
        translate,
        overlayStyle,

        setIsDragging,

        doZoom,
        canvasMouseDown,
        canvasMouseMove,
        canvasMouseUp,
        canvasZoomed,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
}
