import classNames from 'classnames';

import { useUser } from 'src/UserProvider';
import { useCanvas } from './CanvasProvider';
import { useCallback, useMemo, useState } from 'react';
import { objUrlEncode } from 'src/Utils/objUrlEncode';
import { dateIsoToNice } from 'src/Utils/dateIsoToNice';
import { QUICK_FIX } from 'src/Utils/types';
import { IconButton } from '@material-tailwind/react';
import { IoMdBrush, IoIosShareAlt } from 'react-icons/io';
import useBreakpoint from 'src/Utils/useBreakpoint';

interface BottomMenuProps {
  shareButton: (e: React.MouseEvent<HTMLElement> | undefined) => void
  paintButton: (e: React.MouseEvent<HTMLElement> | undefined) => void
}

export const BottomMenu = ({ shareButton, paintButton }: BottomMenuProps) => {
  const { isLogged, loginApi } = useUser();
  const { queryPlace, activePixel, board, colors, activeColor, setActiveColor, times, activeTime, setActiveTime } = useCanvas();
  const screen = useBreakpoint();

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
    <div className='fixed flex bottom-0 text-xs w-[80%] md:w-full md:text-base pointer-events-none'>
      <div className='mx-auto self-center grow max-w-[550px] bg-gray-400/90 pt-2 rounded-tr-lg md:rounded-t-lg flex flex-col pointer-events-auto'>
        <div className='text-black self-center w-full pl-2 pr-2 md:px-6 my-4 my-auto items-center flex flex-row gap-2'>
          {activePixel.x !== -1 &&
            <p className='h-fit whitespace-nowrap'>
              Set by {board.get(`${activePixel.x}:${activePixel.y}`)?.username} at <br />
              {
                board.get(`${activePixel.x}:${activePixel.y}`) ?
                  dateIsoToNice((new Date(board.get(`${activePixel.x}:${activePixel.y}`)?.set_time || '')).toISOString()) :
                  ''
              }
            </p>
          }
          <div className='grow' />

          {isLogged && (
            (
              ['xs', 'sm'].includes(screen) && (
                <IconButton
                  onClick={shareButton}
                  className='w-12 !max-w-12 h-12 !max-h-12 bg-gray-600 rounded-full'
                  {...QUICK_FIX}>
                  <IoMdBrush size={24} />
                </IconButton>
              ) || (
                <button
                  className={classNames('px-2 h-8 bg-gray-500 rounded border-2 border-black hover:border-white')}
                  onClick={paintButton}
                >
                  Paint
                </button>)
            )
          ) || (
            <button
              className={classNames('px-2 min-h-8 bg-gray-500 rounded border-2 border-black hover:border-white')}
              onClick={loginApi}
            >
              Login to paint
            </button>
          )}

          {activePixel.x !== -1 && (
            ['xs', 'sm'].includes(screen) && (
              <IconButton
                onClick={shareButton}
                className='w-12 !max-w-12 h-12 !max-h-12 bg-gray-600 rounded-full'
                {...QUICK_FIX}>
                <IoIosShareAlt />
              </IconButton>
            ) || (
              <button
                className={classNames('px-2 h-8 bg-gray-500 rounded border-2 border-black hover:border-white')}
                onClick={shareButton}
              >
                Share pixel
              </button>
            )
          )}
        </div>
        {
          times === undefined && (
            <div className='self-center w-full p-2 grid grid-cols-8 justify-center gap-2'>
              {Array.from(colors.entries()).map((v) => {
                return (
                  <div key={v[0]}
                    title={v[1].name}
                    className={classNames('min-w-8 min-h-8 md:min-w-14 md:min-h-8 rounded border-2 hover:border-white', activeColor === v[0] ? 'border-white' : 'border-black')}
                    style={{ backgroundColor: 'rgb(' + v[1].color + ')' }}
                    onClick={() => {
                      setActiveColor(v[0]);
                    }}
                  >
                  </div>
                );
              })}
            </div>
          ) || (times !== undefined) && (
            <div className='self-center w-full p-2 flex flex-row flex-wrap justify-center gap-2'>
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
            </div>
          )
        }
      </div>
    </div>
  );
};
