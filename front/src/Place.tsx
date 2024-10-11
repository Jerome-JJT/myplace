import axios from 'axios';
import classNames from 'classnames';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useLogin } from './LoginProvider';
import { Controls } from './Controls';
import { objUrlEncode } from './objUrlEncode';
import { PaintBar } from './PaintBar';
import { BottomMenu } from './BottomMenu';
import { MIN_SCALE, MAX_SCALE, CANVAS_X, CANVAS_Y } from './const';
import { ZoomBar } from './ZoomBar';
import { ColorType, Pixel, Point, Update } from './types';




export function Place() {
  const { isLogged, userInfos, getUserData } = useLogin();

  const [activePixel, setActivePixel] = useState<Point>({ x: -1, y: -1 });
  const [activeColor, setActiveColor] = useState(-1);

  const [colors, setColors] = useState<Map<number, ColorType>>(new Map());
  const [board, setBoard] = useState<Map<string, Pixel>>(new Map());

  const pl = useRef<HTMLCanvasElement | null>(null);

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
    const socket = new WebSocket('/ws/');
    const updates: Update[] = [];

    socket.onopen = () => {
      console.log('WebSocket connected.');
    };

    socket.onmessage = (event) => {
      const incoming = JSON.parse(event.data) as Update[];
      console.log('Received updates:', incoming);

      incoming.forEach((u) => updates.push(u));

      if (pl.current !== null) {
        const ctx = pl.current.getContext('2d');
        if (ctx !== null) {

          setBoard((prev) => {
            const fut = new Map(prev);

            while (updates.length > 0) {
              const up = updates.shift()!;

              const { x, y, ...pixel } = up;
              const color = colors.get(pixel.color_id);

              if (color !== undefined && pixel.set_time > (prev.get(`${x}:${y}`)?.set_time || 0)) {
                ctx.fillStyle = 'rgb(' + color.color + ')';
                ctx.fillRect(x, y, 1, 1);
                fut.set(`${x}:${y}`, pixel);
              }
              else {
                console.log('No need to set', pixel, prev.get(`${x}:${y}`));
              }
            }
            return fut;
          });
        }
      }
    };

    return () => {
      socket.close();
    };
  }, [colors]);

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

  // const loginButton = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
  const loginButton = useCallback(() => {
    const username = prompt('Username');

    if (username && username.length > 3) {
      axios
        .post('/api/mocklogin',
          {
            username: username,
          },
          { withCredentials: true },
        )
        .then(() => {
          getUserData();
        })
        .catch(() => {
        });
    }
  }, [getUserData]);



  const moveRelative = useCallback((x: number, y: number) => {
    setActivePixel((prev) => {
      return {
        x: prev.x !== -1 ? Math.min(Math.max(prev.x + x, 0), CANVAS_X) : -1,
        y: prev.y !== -1 ? Math.min(Math.max(prev.y + y, 0), CANVAS_Y) : -1,
      };
    });
  }, []);


  const paintButton = useCallback(() => {
    if (activePixel.x !== -1 && activePixel.y !== -1) {
      if (activeColor !== -1) {
        axios
          .post('/api/set',
            {
              x:     activePixel.x,
              y:     activePixel.y,
              color: activeColor,
            },
            { withCredentials: true },
          )
          .then((res) => {
            if (res.status === 201) {
              if (pl.current !== null) {
                const ctx = pl.current.getContext('2d');
                if (ctx !== null) {
                  setBoard((prev) => {
                    const fut = new Map(prev);

                    const { x, y, ...pixel } = res.data.update as Update;
                    const color = colors.get(pixel.color_id);

                    if (color !== undefined && pixel.set_time > (prev.get(`${x}:${y}`)?.set_time || 0)) {
                      ctx.fillStyle = 'rgb(' + color.color + ')';
                      ctx.fillRect(x, y, 1, 1);
                      fut.set(`${x}:${y}`, pixel);
                    }
                    return fut;
                  });
                }
              }
            }
          })
          .catch((error) => {
            alert(`${error.response.status} ${error.response.statusText}`);
          });
      }
      else {
        alert('Choose a color');
      }
    }
    else {
      alert('Choose a pixel');
    }
  }, [activeColor, activePixel.x, activePixel.y, colors, pl, setBoard]);



  const numericAction = useCallback((abs: number | undefined, rel: number | undefined) => {

    if (abs !== undefined) {
      if (colors.has(abs)) {
        setActiveColor(abs);
      }
      else {
        setActiveColor(-1);
      }
    }

    if (rel !== undefined) {
      setActiveColor((prev) => {
        const next = (prev - 1 + rel + colors.size) % colors.size + 1;
        if (colors.has(next)) {
          return next;
        }
        return prev;
      });
    }
  }, [colors]);

  const shareButton = useCallback(async () => {

    const args = objUrlEncode({
      'x':     activePixel.x,
      'y':     activePixel.y,
      'scale': scale,
    });

    const base = `${window.location.origin}${window.location.pathname}`;
    const link = `${base}?${args}`;
    window.history.replaceState(null, '', link);

    try {
      await navigator.clipboard.writeText(link);
      alert('Copied to clipboard');
    }
    catch {
      alert('Unable to copy to clipboard');
    }
  }, [activePixel.x, activePixel.y, scale]);

  return (
    <>
      <Controls onMove={moveRelative} onAction={paintButton} onNumeric={numericAction} />

      <canvas
        width={`${CANVAS_X}px`}
        height={`${CANVAS_Y}px`}
        ref={pl}

        onMouseDown={canvasMouseDown}
        onMouseMove={canvasMouseMove}
        onMouseUp={canvasMouseUp}
        onWheel={canvasZoomed}
        onMouseLeave={() => {
          setIsDragging(0);
        }}
        onDoubleClick={(e: React.MouseEvent<HTMLCanvasElement>) => {
          if (scale > (MIN_SCALE + MAX_SCALE) / 2) {
            doZoom(e.pageX, e.pageY, MIN_SCALE);
          }
          else {
            doZoom(e.pageX, e.pageY, MAX_SCALE);
          }
        }}

        style={{
          transform: `scale(${scale}) translate(${translate.x}px, ${translate.y}px)`,
        }}
      >
      </canvas>

      {activePixel.x !== -1 && <div id="overlay" style={overlayStyle}></div>}




      <div className='fixed flex top-0 right-0'>
        <button
          className={classNames('p-2 bg-gray-500 rounded border-2 border-black hover:border-white')}
          onClick={loginButton}
        >
          { isLogged && userInfos?.username || '<Login>' }
        </button>
      </div>

      <ZoomBar scale={scale} setScale={setScale} />

      {isLogged && <PaintBar pixel_buffer={userInfos?.pixel_buffer} timers={userInfos?.timers} />}


      <BottomMenu
        activePixel={activePixel}
        activeColor={activeColor}
        setActiveColor={setActiveColor}
        board={board}
        colors={colors}

        loginButton={loginButton}
        shareButton={shareButton}
        paintButton={paintButton}
      />

    </>
  );
}

