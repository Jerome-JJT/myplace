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

  const [ratio, setRatio] = useState(16);
  const [translate, setTranslate] = useState<co>({ x: 0, y: 0 });

  const [activePixel, setActivePixel] = useState<co>({ x: -1, y: -1 });

  const [dragStart, setDragStart] = useState<co>({ x: -1, y: -1 });
  const [isDragging, setIsDragging] = useState(0);

  // let dragStart = { x: -1, y: -1 };
  // let isDragging = false;

  // const [offset, setOffset] = useState<co>({ x: -1, y: -1 });


  // const centerX = useMemo(() => pl.current && pl.current.width / 2 || -1, [pl]);
  // const centerY = useMemo(() => pl.current && pl.current.height / 2 || -1, [pl]);

  // const offsetX = useMemo(() => pl.current && (pl.current.offsetLeft - (centerX * ratio) + centerX) || -1, [pl, centerX, ratio]);
  // const offsetY = useMemo(() => pl.current && (pl.current.offsetTop) || -1, [pl]);

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
    const newRatio = zoom ? 16 : 40;
    setRatio(newRatio);

  }, [zoom]);

  useEffect(() => {
    if (pl.current !== null && isDragging === 0) {

      const centerX = pl.current.width / 2;
      const centerY = pl.current.height / 2;

      const offsetX = (pl.current.offsetLeft - (centerX * ratio) + centerX);
      const offsetY = pl.current.offsetTop;

      const tx = ((activePixel.x * ratio) + offsetX) + translate.x * ratio;
      const ty = ((activePixel.y * ratio) + offsetY) + translate.y * ratio;

      console.log('render cursor', activePixel.x, ratio, offsetX, centerX, tx);

      setOverlayStyle((prev) => {
        return {
          ...prev,
          width:  `${ratio - 2}px`,
          height: `${ratio - 2}px`,

          top:  ty + 'px',
          left: tx + 'px',
        };
      });
    }
  }, [pl.current?.offsetLeft, pl.current?.offsetTop, ratio, activePixel.x, activePixel.y, translate.x, translate.y, isDragging]);


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

    if (pl.current !== null) {

      const centerX = pl.current.width / 2;
      const centerY = pl.current.height / 2;

      const offsetX = (pl.current.offsetLeft - (centerX * ratio) + centerX);
      const offsetY = pl.current.offsetTop;


      // console.log('base', e, e.pageX, offsetX, centerX, e.pageX - offsetX);

      const clickedX = Math.floor((e.pageX - offsetX) / ratio - translate.x);
      const clickedY = Math.floor((e.pageY - offsetY) / ratio - translate.y);

      // console.log(clickedX, clickedY, ratio, e.pageX, e.pageY, offsetX, offsetY);
      console.log('click', clickedX, clickedY);

      const trX = (centerX - (e.pageX - offsetX)) / ratio;
      const trY = (centerY - (e.pageY - offsetY)) / ratio;


      if (clickedX < 100 && clickedY < 100) {
        setActivePixel({ x: clickedX, y: clickedY });
        console.log('begintr', centerX, clickedX, centerY, clickedY);

        setTranslate({ x: centerX - clickedX, y: centerY - clickedY });
        setRatio(30);
      }
      else {
        setActivePixel({ x: -1, y: -1 });
      }
    }

  }, [ratio, translate.x, translate.y]);


  const canvasZoomed = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const factor = Math.sign(e.deltaY) > 0 ? 0.9 : 1.1;
    console.log('delta', e.deltaY);


    const newRatio = Math.round(Math.min(Math.max(ratio * factor, 16), 40));

    if (pl.current !== null) {
      const centerX = pl.current.width / 2;
      const centerY = pl.current.height / 2;

      const offsetX = (pl.current.offsetLeft - (centerX * newRatio) + centerX);
      const offsetY = pl.current.offsetTop;

      const mouseX = Math.floor((e.pageX - offsetX) / newRatio - translate.x);
      const mouseY = Math.floor((e.pageY - offsetY) / newRatio - translate.y);

      if (e.deltaY < 0) {
        setTranslate({ x: centerX - mouseX, y: centerY - mouseY });
      }
    }

    setRatio(newRatio);
    // setRatio((prev) => {
    //   return (Math.round(Math.min(Math.max(prev * factor, 16), 40)));
    // });
  }, [ratio, translate.x, translate.y]);



  const canvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
  // const canvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (pl.current !== null) {
      const centerX = pl.current.width / 2;
      const centerY = pl.current.height / 2;

      const offsetX = (pl.current.offsetLeft - (centerX * ratio) + centerX);
      const offsetY = pl.current.offsetTop;

      const mouseX = Math.floor((e.pageX - offsetX) / ratio - translate.x);
      const mouseY = Math.floor((e.pageY - offsetY) / ratio - translate.y);


      setDragStart({ x: mouseX, y: mouseY });
      setIsDragging(1);

    }
  }, [ratio, translate.x, translate.y]);
  // };

  const canvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
  // const canvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (pl.current !== null && isDragging >= 1) {
      const centerX = pl.current.width / 2;
      const centerY = pl.current.height / 2;

      const offsetX = (pl.current.offsetLeft - (centerX * ratio) + centerX);
      const offsetY = pl.current.offsetTop;

      const mouseX = Math.floor((e.pageX - offsetX) / ratio - translate.x);
      const mouseY = Math.floor((e.pageY - offsetY) / ratio - translate.y);

      setTranslate((prev) => {
        return {
          x: prev.x - (dragStart.x - mouseX),
          y: prev.y - (dragStart.y - mouseY),
        };
      });
      // setDragStart({ x: mouseX, y: mouseY });

      console.log('drag', isDragging);

      if (isDragging <= 10) {
        setIsDragging((prev) => prev + 1);
      }
    }
  }, [dragStart.x, dragStart.y, isDragging, ratio, translate.x, translate.y]);
  // };

  const canvasMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
  // const canvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging <= 2) {
      canvasClicked(e);
    }
    setIsDragging(0);
  }, [canvasClicked, isDragging]);
  // };




  return (
    <>
      <canvas
        width="50px"
        height="50px"
        ref={pl}
        // onClick={}
        onWheel={canvasZoomed}

        onDoubleClick={() => {
          setRatio(16);
        }}

        onMouseDown={canvasMouseDown}
        onMouseMove={canvasMouseMove}
        onMouseUp={canvasMouseUp}

        onMouseLeave={() => {
          setIsDragging(0);
        }}

        // onMouseDown={(e: React.MouseEvent<HTMLCanvasElement>) => {
        //   if (pl.current !== null) {
        //     const centerX = pl.current.width / 2;
        //     const centerY = pl.current.height / 2;

        //     const offsetX = (pl.current.offsetLeft - (centerX * ratio) + centerX);
        //     const offsetY = pl.current.offsetTop;

        //     const mouseX = Math.floor((e.pageX - offsetX) / ratio - translate.x);
        //     const mouseY = Math.floor((e.pageY - offsetY) / ratio - translate.y);


        //     dragStart = { x: mouseX, y: mouseY };
        //     isDragging = true;
        //   }
        // }}

        // onMouseMove={(e: React.MouseEvent<HTMLCanvasElement>) => {
        //   if (pl.current !== null && isDragging === true) {
        //     const centerX = pl.current.width / 2;
        //     const centerY = pl.current.height / 2;

        //     const offsetX = (pl.current.offsetLeft - (centerX * ratio) + centerX);
        //     const offsetY = pl.current.offsetTop;

        //     const mouseX = Math.floor((e.pageX - offsetX) / ratio - translate.x);
        //     const mouseY = Math.floor((e.pageY - offsetY) / ratio - translate.y);

        //     setTranslate((prev) => {
        //       return {
        //         x: prev.x - (dragStart.x - mouseX),
        //         y: prev.y - (dragStart.y - mouseY),
        //       };
        //     });
        //     dragStart = { x: mouseX, y: mouseY };
        //   }
        // }}


        // onMouseUp={(e: React.MouseEvent<HTMLCanvasElement>) => {
        //   if (isDragging === true) {
        //     isDragging = false;
        //   }
        //   else {
        //     canvasClicked(e);
        //   }
        // }}


        style={{
          // width:      '50px',
          // height:     '50px',
          transform:  `scale(${ratio}) translate(${translate.x}px, ${translate.y}px)`,
          transition: 'transform 0.1s linear',
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

