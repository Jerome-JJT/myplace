import axios from 'axios';
import classNames from 'classnames';
import { useRef, useState, useEffect, useCallback } from 'react';


interface pixel {
    user: string,
    time: Date,
    color_id: number
}

export function Place() {
  const pl = useRef<HTMLCanvasElement | null>(null);

  const [ratio, setRatio] = useState(16);

  const [activePixel, setActivePixel] = useState<{x: number, y: number}>({ x: -1, y: -1 });
  const [offset, setOffset] = useState<{x: number, y: number}>({ x: -1, y: -1 });
  const [translate, setTranslate] = useState<{x: number, y: number}>({ x: -1, y: -1 });

  const [colors, setColors] = useState<Map<number, { name: string, color: string }>>(new Map());
  const [board, setBoard] = useState<Map<string, pixel>>(new Map());

  const [zoom, setZoom] = useState(true);
  const [activeColor, setActiveColor] = useState(-1);
  const [overlayStyle, setOverlayStyle] = useState({
    width:  `${ratio - 2}px`,
    height: `${ratio - 2}px`,
    top:    '0px',
    left:   '0px',
  });


  useEffect(() => {
    const newRatio = zoom ? 16 : 40;
    setRatio(newRatio);

  }, [zoom]);

  useEffect(() => {
    setOverlayStyle((prev) => {
      return {
        ...prev,
        width:  `${ratio - 2}px`,
        height: `${ratio - 2}px`,

        top:  ((activePixel.y * ratio) + offset.y) + 'px',
        left: ((activePixel.x * ratio) + offset.x) + 'px',
      };
    });
  }, [ratio, activePixel.x, activePixel.y, offset.x, offset.y]);


  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8081');

    socket.onopen = () => {
      console.log('WebSocket connected.');
    };

    // socket.onmessage = (event) => {
    //     // Parse the incoming message
    //     const updates = JSON.parse(event.data);
    //     console.log('Received updates:', updates);

    //     // Apply updates to the board
    //     setBoard((prevBoard) => {
    //       const newBoard = [...prevBoard];
    //       updates.forEach(({ x, y, color }) => {
    //         // Update only the cells that have been changed
    //         newBoard[x][y] = color;
    //       });
    //       return newBoard;
    //     });
    //   };
  }, []);

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

              (res.data.board as pixel[][]).forEach((column, x) => {
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


  const canvasClicked = useCallback((e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const offsetX = (e.target as HTMLCanvasElement).offsetLeft;
    const offsetY = (e.target as HTMLCanvasElement).offsetTop;

    const centerX = (e.target as HTMLCanvasElement).width / 2;
    const centerY = (e.target as HTMLCanvasElement).height / 2;

    setOffset({ x: offsetX, y: offsetY });

    const clickedX = Math.floor((e.pageX - offsetX) / Math.floor(ratio));
    const clickedY = Math.floor((e.pageY - offsetY) / Math.floor(ratio));

    // console.log(clickedX, clickedY, ratio, e.pageX, e.pageY, offsetX, offsetY);

    const trX = (centerX - (e.pageX - offsetX)) * 40;
    const trY = (centerY - (e.pageY - offsetY)) * 40;

    // console.log(trX, trY, e.pageX, e.pageY, centerX, centerY, offsetX, offsetY);

    // setTranslate({ x: trX, y: trY });
    setRatio(40);



    if (clickedX < 100 && clickedY < 100) {
      setActivePixel({ x: clickedX, y: clickedY });
    }
    else {
      setActivePixel({ x: -1, y: -1 });
    }

  }, [ratio]);

  return (
    <>
      <canvas width="50" height="50" ref={pl} onClick={canvasClicked}
        style={{
          transform:  `scale(${ratio})`,
          transition: 'transform 1.4s linear',
          translate:  `(${translate.x / ratio}px, ${translate.y / ratio}px)`,
        //   transformOrigin: 'center center',
        }}

        onWheel={(e: any) => {
          console.log(e);
          e.preventDefault();
          e.stopPropagation();

          // const off = {
          //     x: e.pageX - pl.current!.offsetLeft,
          //     y: e.pageY - pl.current!.offsetTop
          // }

          const factor = Math.sign(e.deltaY) > 0 ? 0.9 : 1.1;

          setRatio((prev) => {
            return (Math.min(Math.max(prev * factor, 16), 40));
          });
        }}
      >

      </canvas>

      {activePixel.x !== -1 && <div id="overlay" style={overlayStyle}></div>}

      <div className='fixed flex bottom-0 w-full'>
        <div id='menu' className='mx-auto self-center bg-red-500 flex flex-col '>
          <div className='self-center bg-blue-500 w-40'>
                        text
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
                        setZoom(!zoom);
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

