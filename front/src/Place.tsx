import axios from 'axios';
import classNames from 'classnames';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useLogin } from './LoginProvider';


interface Pixel {
    username: string,
    time: Date,
    color_id: number
}

export interface Update extends Pixel {
  x: number
  y: number
}

interface Point {
  x: number,
  y: number
}

export function Place() {
  const { isLogged, userInfos, getUserData } = useLogin();

  const [activePixel, setActivePixel] = useState<Point>({ x: -1, y: -1 });
  const [activeColor, setActiveColor] = useState(-1);

  const [colors, setColors] = useState<Map<number, { name: string, color: string }>>(new Map());
  const [board, setBoard] = useState<Map<string, Pixel>>(new Map());

  const pl = useRef<HTMLCanvasElement | null>(null);

  const MIN_ZOOM = 8;
  const MAX_ZOOM = 40;

  const [scale, setScale] = useState(MIN_ZOOM);
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
    const socket = new WebSocket('ws://localhost:8081');
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

              if (color !== undefined && pixel.time > (prev.get(`${x}:${y}`)?.time || 0)) {
                ctx.fillStyle = 'rgb(' + color.color + ')';
                ctx.fillRect(x, y, 1, 1);
                fut.set(`${x}:${y}`, pixel);
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
            }
          })
          .catch((error) => {
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

      if (clickedX < 100 && clickedY < 100) {
        setActivePixel({ x: clickedX, y: clickedY });
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
    const newScale = Math.round(Math.min(Math.max(scale * factor, MIN_ZOOM), MAX_ZOOM));

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

  const loginButton = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const username = prompt('Username');

    if (username && username.length > 3) {
      axios
        .post('/api/mocklogin',
          {
            username: username,
          },
          { withCredentials: true },
        )
        .then((res) => {
          getUserData();
        })
        .catch((error) => {
        });
    }
  }, [getUserData]);

  const paintButton = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
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
          })
          .catch((error) => {
          });
      }
      else {
        alert('Choose a color');
      }
    }
    else {
      alert('Choose a pixel');
    }
  }, [activeColor, activePixel]);


  return (
    <>
      <canvas
        width="100px"
        height="100px"
        ref={pl}

        onMouseDown={canvasMouseDown}
        onMouseMove={canvasMouseMove}
        onMouseUp={canvasMouseUp}
        onWheel={canvasZoomed}
        onMouseLeave={() => {
          setIsDragging(0);
        }}
        onDoubleClick={(e: React.MouseEvent<HTMLCanvasElement>) => {
          if (scale > (MIN_ZOOM + MAX_ZOOM) / 2) {
            doZoom(e.pageX, e.pageY, MIN_ZOOM);
          }
          else {
            doZoom(e.pageX, e.pageY, MAX_ZOOM);
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


      <div className='fixed flex bottom-0 w-full pointer-events-none'>
        <div id='menu' className='mx-auto self-center bg-red-500 flex flex-col pointer-events-auto'>
          <div className='self-center my-4 my-auto items-center flex flex-row gap-4'>
            {activePixel.x !== -1 &&
              <p className='h-fit'>
                Set by {board.get(`${activePixel.x}:${activePixel.y}`)?.username} at {
                  board.get(`${activePixel.x}:${activePixel.y}`) ? (new Date(board.get(`${activePixel.x}:${activePixel.y}`)?.time || '')).toISOString() : ''
                }
              </p>
            }
            <button
              className={classNames('w-14 h-8 bg-gray-500 rounded border-2 border-black hover:border-white')}
              onClick={paintButton}
            >
              Paint
            </button>
          </div>
          <div className='self-center bg-green-500 p-2 flex flex-row gap-2'>
            {
              Array.from(colors.entries()).map((v) => {
                return (
                  <div key={v[0]} className='text-center'>
                    <div
                      className={classNames('w-14 h-8 rounded border-2 hover:border-white', activeColor === v[0] ? 'border-white' : 'border-black')}
                      style={{ backgroundColor: 'rgb(' + v[1].color + ')' }}
                      onClick={() => {
                        setActiveColor(v[0]);
                      }}
                    >
                    </div>
                    {v[1].name}
                  </div>
                );
              })
            }
          </div>
        </div>
      </div>
    </>
  );
}

