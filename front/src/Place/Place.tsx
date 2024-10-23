import axios from 'axios';
import { useEffect, useCallback } from 'react';

import { CANVAS_X, CANVAS_Y } from 'src/Utils/consts';
import { Update } from 'src/Utils/types';
import { useUser } from 'src/UserProvider';
import { objUrlEncode } from 'src/Utils/objUrlEncode';

import { Controls } from './Controls';
import { PaintBar } from './PaintBar';
import { BottomMenu } from './BottomMenu';
import { ZoomBar } from './ZoomBar';
import { useCanvas } from './CanvasProvider';
import { DisplayCanvas } from './Canvas';
import { useNotification } from 'src/NotificationProvider';



export function Place() {
  const { isLogged, setPixelInfos } = useUser();
  const { addNotif } = useNotification();
  const { pl, board, queryPlace, activePixel, setActivePixel, activeColor, setActiveColor, colors, setBoard, scale } = useCanvas();


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
  }, [colors, pl, setBoard]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    queryPlace(params.get('time') || undefined, undefined);
  }, [board.size, queryPlace]);

  const paintButton = useCallback((e: React.MouseEvent<HTMLElement> | undefined) => {
    e?.currentTarget.blur();

    if (isLogged) {
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
                    setPixelInfos(res.data.timers);
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
  }, [activeColor, activePixel.x, activePixel.y, addNotif, colors, isLogged, pl, setBoard, setPixelInfos]);


  const shareButton = useCallback(async (e: React.MouseEvent<HTMLElement> | undefined) => {
    e?.currentTarget.blur();
    const args = objUrlEncode({
      'x':     Math.min(Math.max(activePixel.x, 0), CANVAS_X),
      'y':     Math.min(Math.max(activePixel.y, 0), CANVAS_Y),
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
  }, [activePixel.x, activePixel.y, addNotif, scale]);


  const moveRelative = useCallback((x: number, y: number) => {
    setActivePixel((prev) => {
      return {
        x: prev.x !== -1 ? Math.min(Math.max(prev.x + x, 0), CANVAS_X) : -1,
        y: prev.y !== -1 ? Math.min(Math.max(prev.y + y, 0), CANVAS_Y) : -1,
      };
    });
  }, [setActivePixel]);


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
  }, [colors, setActiveColor]);


  return (
    <>
      <Controls onMove={moveRelative} onAction={paintButton} onNumeric={numericAction} />

      <DisplayCanvas />

      <ZoomBar />

      <PaintBar />

      <BottomMenu
        shareButton={shareButton}
        paintButton={paintButton}
      />
    </>
  );
}

