import axios from 'axios';
import classNames from 'classnames';
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';


interface pixel {
    user: string,
    time: Date,
    color_id: number
}

interface co {
  x: number,
  y: number
}

export function Place() {
  const pl = useRef<HTMLCanvasElement | null>(null);

  const [scale, setScale] = useState(8);
  const [translate, setTranslate] = useState<co>({ x: 0, y: 0 });

  const [activePixel, setActivePixel] = useState<co>({ x: -1, y: -1 });

  const [dragStart, setDragStart] = useState<co>({ x: -1, y: -1 });
  const [isDragging, setIsDragging] = useState(0);


  const [colors, setColors] = useState<Map<number, { name: string, color: string }>>(new Map());
  const [board, setBoard] = useState<Map<string, pixel>>(new Map());

  const [activeColor, setActiveColor] = useState(-1);
  const [overlayStyle, setOverlayStyle] = useState({
    width:  `${scale - 2}px`,
    height: `${scale - 2}px`,
    top:    '0px',
    left:   '0px',
  });

  // const [windowSize, setWindowSize] = useState<{width: number| undefined, height: number | undefined}>({
  //   width:  undefined,
  //   height: undefined,
  // });
  // useEffect(() => {
  //   function handleResize() {
  //     setWindowSize({
  //       width:  window.innerWidth,
  //       height: window.innerHeight,
  //     });
  //   }
  //   window.addEventListener('resize', handleResize);
  //   handleResize();
  //   return () => window.removeEventListener('resize', handleResize);
  // }, []);

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

      // console.log('render cursor', activePixel.x, scale, offsetX, centerX, tx);

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
      const trueOffsetX = pl.current.offsetLeft - centerX * scale;
      const trueOffsetY = pl.current.offsetTop - centerY * scale;


      const offsetX = trueOffsetX + translate.x * scale;
      const offsetY = trueOffsetY + translate.y * scale;

      const mouseX = ((e.pageX - offsetX) - centerX) / scale;
      const mouseY = ((e.pageY - offsetY) - centerY) / scale;

      console.log('mouse ONE', mouseX, mouseY);

      const clickedX = Math.floor(mouseX);
      const clickedY = Math.floor(mouseY);




      if (clickedX < 100 && clickedY < 100) {
        setActivePixel({ x: clickedX, y: clickedY });
        // setTranslate({ x: centerX - clickedX, y: centerY - clickedY });
        // setScale(30);
      }
      else {
        setActivePixel({ x: -1, y: -1 });
      }
    }

  }, [scale, translate.x, translate.y]);


  const canvasZoomed = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.stopPropagation();

    const factor = Math.sign(e.deltaY) > 0 ? 0.9 : 1.1;
    const newScale = Math.round(Math.min(Math.max(scale * factor, 8), 40));

    if (pl.current !== null) {

      const centerX = pl.current.width / 2;
      const centerY = pl.current.height / 2;
      const trueOffsetX = pl.current.offsetLeft - centerX * scale;
      const trueOffsetY = pl.current.offsetTop - centerY * scale;


      const offsetX = trueOffsetX + (centerX + (translate.x * scale * 2));
      const offsetY = trueOffsetY + (centerY + (translate.y * scale * 2));

      const mouseX = ((e.pageX - offsetX) / scale + translate.x - centerX);
      const mouseY = ((e.pageY - offsetY) / scale + translate.y - centerY);

      // console.log('mouse TWO', mouseX, mouseY);

      setTranslate((prev) => ({
        x: ((mouseX + prev.x) * (scale / newScale)) - (mouseX),
        y: ((mouseY + prev.y) * (scale / newScale)) - (mouseY),
      }));

    }

    setScale(newScale);
  }, [scale, translate.x, translate.y]);



  const canvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (pl.current !== null) {

      const centerX = pl.current.width / 2;
      const centerY = pl.current.height / 2;
      const trueOffsetX = pl.current.offsetLeft - centerX * scale;
      const trueOffsetY = pl.current.offsetTop - centerY * scale;


      const offsetX = trueOffsetX + translate.x * scale;
      const offsetY = trueOffsetY + translate.y * scale;

      const mouseX = ((e.pageX - offsetX) - centerX) / scale;
      const mouseY = ((e.pageY - offsetY) - centerY) / scale;

      console.log('mouse THREE', mouseX, mouseY);

      setDragStart({ x: mouseX, y: mouseY });
      setIsDragging(1);
    }
  }, [scale, translate.x, translate.y]);

  const canvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (pl.current !== null && isDragging >= 1) {
    // if (pl.current !== null) {

      const centerX = pl.current.width / 2;
      const centerY = pl.current.height / 2;
      const trueOffsetX = pl.current.offsetLeft - centerX * scale;
      const trueOffsetY = pl.current.offsetTop - centerY * scale;


      const offsetX = trueOffsetX + translate.x * scale;
      const offsetY = trueOffsetY + translate.y * scale;

      const mouseX = ((e.pageX - offsetX) - centerX) / scale;
      const mouseY = ((e.pageY - offsetY) - centerY) / scale;

      console.log('mouse FOUR', mouseX, mouseY);


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
    <>
      <canvas
        width="100px"
        height="100px"
        ref={pl}
        // onClick={}
        onWheel={canvasZoomed}

        onDoubleClick={() => {
          setScale(8);
        }}

        onMouseDown={canvasMouseDown}
        onMouseMove={canvasMouseMove}
        onMouseUp={canvasMouseUp}

        onMouseLeave={() => {
          setIsDragging(0);
        }}

        style={{
          transform: `scale(${scale}) translate(${translate.x}px, ${translate.y}px)`,
          // transition: 'transform 0.1s linear',
        }}

      >
      </canvas>

      {activePixel.x !== -1 && <div id="overlay" style={overlayStyle}></div>}

      <div className='fixed flex bottom-0 w-full pointer-events-none'>
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
                        setTranslate({ x: 0, y: 0 });
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

