import axios from 'axios';
import { useEffect, useCallback } from 'react';
import { useUser } from './UserProvider';
import { Controls } from './Controls';
import { objUrlEncode } from './objUrlEncode';
import { PaintBar } from './PaintBar';
import { BottomMenu } from './BottomMenu';
import { CANVAS_X, CANVAS_Y } from './consts';
import { ZoomBar } from './ZoomBar';
import { Update } from './types';
import { useCanvas } from './CanvasProvider';
import { DisplayCanvas } from './Canvas';
import { LoginBox } from './LoginBox';



export function Place() {
  const { getUserData } = useUser();
  const { pl, activePixel, setActivePixel, activeColor, setActiveColor, colors, setBoard, scale } = useCanvas();


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

      <LoginBox loginButton={loginButton} />

      <ZoomBar />

      <PaintBar />

      <BottomMenu
        loginButton={loginButton}
        shareButton={shareButton}
        paintButton={paintButton}
      />
    </>
  );
}

