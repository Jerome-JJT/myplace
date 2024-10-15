import { useEffect, useState } from 'react';

import { useUser } from 'src/UserProvider';

export const PaintBar = () => {
  const { isLogged, infos, setPixelInfos } = useUser();
  const [ nextPixelSeconds, setNextPixelSeconds ] = useState(-1);

  useEffect(() => {
    const interval = setInterval(() => {
      if (infos !== undefined && infos.timers !== undefined && infos.timers.length > 0) {

        const now = (new Date()).toISOString();
        const nextClearPixel = infos.timers.reduce<string | undefined>((prev, v) => {
          if (v > now && (prev === undefined || v < prev)) {
            return v;
          }
          else {
            return prev;
          }
        }, undefined);

        if (nextClearPixel !== undefined) {
          const seconds = ((new Date(nextClearPixel)).getTime() - (new Date()).getTime()) / 1000;

          setNextPixelSeconds(seconds);
        }
        else {
          setNextPixelSeconds(-1);
        }

        if (infos.timers.some((v) => v <= now)) {
          setPixelInfos(infos.timers.filter((v) => v > now));
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [infos, setPixelInfos]);

  return (
    isLogged && (
      <div className='fixed flex flex-col md:justify-center top-[50px] md:top-0 right-4 h-[100%] w-6 md:w-12 pointer-events-none'>
        <div className='p-1 rounded bg-gray-400/90'>
          <div className='whitespace-nowrap'>{infos && (infos.pixel_buffer - infos.timers.length)}</div>
          <div>{nextPixelSeconds !== -1 && `${Math.round(nextPixelSeconds)}s`}</div>

          <div className='flex flex-col bg-red-500 h-40 md:h-80'>
            <div className='grow' />
            <div
              className='bg-cyan-500'
              style={{
                height: `${infos && (100 - infos.timers.length / infos.pixel_buffer * 100)}%`,
              }}>
            </div>
          </div>
        </div>
      </div>
    )
  );
};
