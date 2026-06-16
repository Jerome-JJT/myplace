import { useEffect, useState } from 'react';

import { useUser } from 'src/UserProvider';

export const PaintBar = () => {
  const { isLogged, infos, setPixelInfos } = useUser();
  const [ nextPixelSeconds, setNextPixelSeconds ] = useState(-1);

  useEffect(() => {
    const interval = setInterval(() => {
      if (infos !== undefined && infos.timers !== undefined && infos.timers.length > 0) {

        const now = (new Date()).getTime();
        const nextClearPixel = infos.timers.reduce<number | undefined>((prev, v) => {
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
        <div className='rounded bg-gray-400/90'>
          <div className='whitespace-nowrap'>{infos && (infos.pixel_buffer - infos.timers.length)}</div>
          <div className='text-[8px] md:text-xs'>{nextPixelSeconds !== -1 && (
            nextPixelSeconds < 60 ? `${Math.round(nextPixelSeconds)}s` : `${Math.round((nextPixelSeconds / 60) * 10) / 10}m`
          )}</div>

          <div className='mx-1 mb-1 flex flex-col h-40 md:h-80' style={{
            backgroundColor: 'rgb(128,0,0)',
            backgroundImage: 'linear-gradient(180deg, rgba(128,0,0,1) 0%, rgba(204,0,0,1) 50%)',
          }}>
            <div className='grow' />
            <div
              style={{
                height:          `${infos && (100 - infos.timers.length / infos.pixel_buffer * 100)}%`,
                backgroundColor: 'rgb(87,226,235)',
                backgroundImage: 'linear-gradient(180deg, rgba(87,226,235,1) 0%, rgba(0,128,128,1) 100%)',
              }}>
            </div>
          </div>
        </div>
      </div>
    )
  );
};
