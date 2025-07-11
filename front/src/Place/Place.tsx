import axios from 'axios';
import { useState, useEffect, useCallback } from 'react';

import { CANVAS_MAX_X, CANVAS_MAX_Y, CANVAS_MIN_X, CANVAS_MIN_Y, CANVAS_SIZE_X, CANVAS_SIZE_Y } from 'src/Utils/consts';
import { ColorType, PixelFromNetwork, Update } from 'src/Utils/types';
import { useUser } from 'src/UserProvider';
import { objUrlEncode } from 'src/Utils/objUrlEncode';

import { Controls } from './Controls';
import { PaintBar } from './PaintBar';
import { BottomMenu } from './BottomMenu';
import { ZoomBar } from './ZoomBar';
import { useCanvas } from './CanvasProvider';
import { canvasMarginTop, DisplayCanvas } from './Canvas';
import { useNotification } from 'src/NotificationProvider';



export function Place() {
  const { isLogged, setPixelInfos, setIsConnected, setInfos } = useUser();
  const { addNotif } = useNotification();
  const { pl, image, queryPlace, activePixel, setActivePixel, activeColor, setActiveColor, colors, setBoard, scale, setNbConnecteds } = useCanvas();
  const params = new URLSearchParams(window.location.search);
  const paramView = params.get('view') !== null;
  const paramType = params.get('type');
  const paramTime = params.get('time');
  const [reloadId, setReloadId] = useState(0);

  useEffect(() => {
    if (paramTime !== null) {
      return ;
    }
    const socket = new WebSocket(`${document.location.protocol.includes('https') ? 'wss' : 'ws'}://${document.location.host}/ws/`);
    const sockId = Math.round(Math.random() * 10000);
    const updates: Update[] = [];
    let interval: NodeJS.Timeout | undefined = undefined;

    socket.onopen = () => {
      console.log(`WebSocket ${sockId} connected.`);
      setIsConnected((_prev) => true);
    };

    socket.onmessage = (event) => {

      const message = JSON.parse(event.data);
      if (message.type === undefined) {
        return;
      }

      else if (message.type === 'ping') {
        console.log('pong');
      }

      else if (message.type === 'connecteds') {
        setNbConnecteds(message.nbConnecteds);
      }

      else if (message.type === 'updates') {
        const incoming = message.updates as Update[];
        console.log(`${sockId} Received updates:`, incoming);

        incoming.forEach((u) => updates.push(u));

        if (pl.current !== null) {
          const ctx = pl.current.getContext('2d');
          if (ctx !== null) {

            setBoard((prev) => {
              const fut = new Map(prev);

              while (updates.length > 0) {
                const up = updates.shift()!;

                const { x, y, ...npixel } = up;
                const pixel = PixelFromNetwork(npixel);
                const color = colors.get(pixel.color_id);

                if (color !== undefined && pixel.set_time > (prev.get(`${x}:${y}`)?.set_time || 0)) {
                  ctx.fillStyle = 'rgb(' + color.color + ')';
                  ctx.fillRect(x - CANVAS_MIN_X, y - CANVAS_MIN_Y, 1, 1);
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
      }
    };

    socket.onclose = (event) => {
      setIsConnected((_prev) => false);
      console.log(`WebSocket ${sockId} closed type ${event.code}.`);

      if (event.code === 1006 && paramView) {
        console.log('Auto reloading in 30s');

        interval = setTimeout(() => {
          console.log('send query');
          queryPlace(paramTime ?? undefined, paramType ?? 'board', undefined);
          setReloadId((prev) => prev + 1);
        }, 30000);
      }
    };

    return () => {
      if (interval !== undefined) {
        clearTimeout(interval);
      }
      if (!([socket.CLOSED, socket.CLOSING] as number[]).includes(socket.readyState)) {
        socket.close();
      }
    };
  }, [colors, pl, setBoard, setIsConnected, paramView, queryPlace, paramTime, paramType, reloadId]);

  useEffect(() => {
    // const params = new URLSearchParams(window.location.search);
    queryPlace(paramTime ?? undefined, paramType ?? 'board', undefined);
  }, [paramTime, paramType, queryPlace]);

  const paintButton = useCallback((e: React.MouseEvent<HTMLElement> | undefined) => {
    e?.currentTarget.blur();

    if (isLogged) {
      if (activePixel !== undefined) {
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

                      const { x, y, ...npixel } = res.data.update as Update;
                      const pixel = PixelFromNetwork(npixel);
                      const color = colors.get(pixel.color_id);

                      if (color !== undefined && pixel.set_time > (prev.get(`${x}:${y}`)?.set_time || 0)) {
                        ctx.fillStyle = 'rgb(' + color.color + ')';
                        ctx.fillRect(x - CANVAS_MIN_X, y - CANVAS_MIN_Y, 1, 1);
                        fut.set(`${x}:${y}`, pixel);
                      }
                      return fut;
                    });
                    setInfos((prev) => {
                      return {
                        ...prev,
                        ...res.data.userInfos,
                        timers: res.data.timers
                      }
                    });
                  }
                }
              }
            })
            .catch((error) => {
              if (error.response.status === 425) {
                setPixelInfos(error.response.data.timers);
                addNotif('No pixel available to put', 'warning');
              }
              else if (error.response.status === 420) {
                if (error.response.data.interval > 0) {
                  addNotif(`Wait for start in ${Math.abs(error.response.data.interval)} seconds`, 'warning');
                }
                else {
                  addNotif(`Over since ${Math.abs(error.response.data.interval)} seconds`, 'warning');
                }
              }
              else {
                addNotif(`${error.response.status} ${error.response.statusText}`, 'error');
              }
            });
        }
        else {
          addNotif('Choose a color', 'warning');
        }
      }
      else {
        addNotif('Choose a pixel', 'warning');
      }
    }
    else {
      addNotif('Login first', 'warning');
    }
  }, [activeColor, activePixel?.x, activePixel?.y, addNotif, colors, isLogged, pl, setBoard, setPixelInfos]);


  const shareButton = useCallback(async (e: React.MouseEvent<HTMLElement> | undefined) => {
    e?.currentTarget.blur();

    if (activePixel !== undefined) {
      const args = objUrlEncode({
        'x':     Math.min(Math.max(activePixel.x, CANVAS_MIN_X), CANVAS_MAX_X),
        'y':     Math.min(Math.max(activePixel.y, CANVAS_MIN_Y), CANVAS_MAX_Y),
        'scale': scale,
      });
  
      const base = `${window.location.origin}${window.location.pathname}`;
      const link = `${base}?${args}`;
      window.history.replaceState(null, '', link);
  
      try {
        await navigator.clipboard.writeText(link);
        addNotif('Location copied to clipboard', 'info');
      }
      catch (error) {
        console.error(error);
        addNotif('Unable to copy to clipboard', 'error');
      }
    }
    else {
      addNotif('No pixel selected', 'warning');
    }
  }, [activePixel?.x, activePixel?.y, addNotif, scale]);


  const moveRelative = useCallback((x: number, y: number) => {
    setActivePixel((prev) => {
      return {
        x: prev !== undefined ? Math.min(Math.max(prev.x + x, CANVAS_MIN_X), CANVAS_MAX_X) : -1,
        y: prev !== undefined ? Math.min(Math.max(prev.y + y, CANVAS_MIN_Y), CANVAS_MAX_Y) : -1,
      };
    });
  }, [setActivePixel]);


  const numericAction = useCallback((abs: number | undefined, rel: number | undefined) => {
    if (abs !== undefined) {
      const found = Array.from(colors.entries()).find((c) => c[1].corder === abs);
      if (found !== undefined) {
        setActiveColor(found[0]);
      }
      else {
        setActiveColor(-1);
      }
    }

    if (rel !== undefined) {
      setActiveColor((prev) => {
        const prevCid = colors.get(prev)?.corder || 0;

        const next = Array.from(colors.entries()).reduce((acc: [number, ColorType] | undefined, [k, v]: [number, ColorType]) => {
          if (v.corder > prevCid && (acc === undefined || v.corder < acc[1].corder)) {
            return [k, v];
          }
          return acc;
        }, undefined) ;
        
        if (next !== undefined) {
          return next[0];
        }
        else {
          return colors.keys().next().value || 1;
        }
      });
    }
  }, [colors, setActiveColor]);


  return (
    <>
      { params.get('view') == null && (
        <Controls onMove={moveRelative} onAction={paintButton} onNumeric={numericAction} />
      )}

      <img
        className='canvas_display'
        width={`${CANVAS_SIZE_X}px`}
        height={`${CANVAS_SIZE_Y}px`}
        style={{
          transform: `scale(${scale})`,
          marginTop: canvasMarginTop,
          display:   (image !== undefined ? 'block' : 'none'),
        }}
        src={`data:image/png;base64,${image}`} 
      />
      <DisplayCanvas />

      {
        params.get('view') == null && (
          <>
            <ZoomBar />

            <PaintBar />

            <BottomMenu
              shareButton={shareButton}
              paintButton={paintButton}
            />
          </>
        )
      }
    </>
  );
}

