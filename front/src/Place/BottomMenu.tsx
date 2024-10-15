import classNames from 'classnames';

import { useUser } from 'src/UserProvider';
import { useCanvas } from './CanvasProvider';
import { useCallback, useMemo, useState } from 'react';
import { objUrlEncode } from 'src/Utils/objUrlEncode';
import { dateIsoToNice } from 'src/Utils/dateIsoToNice';

interface BottomMenuProps {
  shareButton: (e: React.MouseEvent<HTMLElement> | undefined) => void
  paintButton: (e: React.MouseEvent<HTMLElement> | undefined) => void
}

export const BottomMenu = ({ shareButton, paintButton }: BottomMenuProps) => {
  const { isLogged, loginApi } = useUser();
  const { queryPlace, activePixel, board, colors, activeColor, setActiveColor, times, activeTime, setActiveTime } = useCanvas();

  const [isLoading, setIsLoading] = useState(false);

  const { minText, currentText, maxText } = useMemo(() => {
    const minDate = times !== undefined && (new Date(times.min * 1000)).toISOString() || '';
    const currentDate = (new Date(activeTime * 1000)).toISOString();
    const maxDate = times !== undefined && (new Date(times.max * 1000)).toISOString() || '';

    return { minText: dateIsoToNice(minDate), currentText: dateIsoToNice(currentDate), maxText: dateIsoToNice(maxDate) };
  }, [activeTime, times]);

  const setTime = useCallback(() => {
    setIsLoading(true);
    const isoTime = (new Date(activeTime * 1000)).toISOString();

    const params = new URLSearchParams(window.location.search);
    const args = objUrlEncode({
      ...Object.fromEntries(params),
      'time': isoTime,
    });

    const base = `${window.location.origin}${window.location.pathname}`;
    const link = `${base}?${args}`;
    window.history.replaceState(null, '', link);

    queryPlace(isoTime, () => {
      setIsLoading(false);
    });
  }, [activeTime, queryPlace]);

  return (
    <div className='fixed flex bottom-0 w-full pointer-events-none'>
      <div id='menu' className='mx-auto self-center bg-red-500 flex flex-col pointer-events-auto'>
        <div className='self-center my-4 my-auto items-center flex flex-row gap-4'>
          {activePixel.x !== -1 &&
            <p className='h-fit'>
              Set by {board.get(`${activePixel.x}:${activePixel.y}`)?.username} at {
                board.get(`${activePixel.x}:${activePixel.y}`) ? dateIsoToNice((new Date(board.get(`${activePixel.x}:${activePixel.y}`)?.set_time || '')).toISOString()) : ''
              }
            </p>
          }

          {isLogged && (
            <button
              className={classNames('px-2 h-8 bg-gray-500 rounded border-2 border-black hover:border-white')}
              onClick={paintButton}
            >
              Paint
            </button>
          ) || (
            <button
              className={classNames('px-2 h-8 bg-gray-500 rounded border-2 border-black hover:border-white')}
              onClick={loginApi}
            >
              Log to paint
            </button>
          )}

          {activePixel.x !== -1 &&
            <button
              className={classNames('px-2 h-8 bg-gray-500 rounded border-2 border-black hover:border-white')}
              onClick={shareButton}
            >
              Share pixel
            </button>
          }
        </div>
        <div className='self-center w-full bg-green-500 p-2 flex flex-row flex-wrap justify-center gap-2 max-w-[550px]'>
          {
            times === undefined && (
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
            ) || (times !== undefined) && (
              <div className='w-full'>
                <div className='grid grid-cols-5'>
                  <div>{minText}</div>
                  <div>|</div>
                  <div>{currentText}</div>
                  <div>|</div>
                  <div>{maxText}</div>
                </div>
                <input
                  className={'w-[400px]'}
                  type={'range'}
                  min={times.min}
                  max={times.max}
                  value={activeTime}
                  onChange={(e) => {
                    setActiveTime(parseInt(e.target.value));
                  }}
                />
                <button
                  onClick={setTime}
                  className={classNames(
                    'w-14 h-8 ml-6 rounded bg-blue-400 border-2 border-black',
                    isLoading && 'bg-gray-400 pointer-none hover:border-black',
                    !isLoading && 'hover:border-white',
                  )}
                  disabled={isLoading}
                >
                  View
                </button>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
};
