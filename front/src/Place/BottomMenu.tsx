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
import { useDebounce } from 'src/Utils/useDebounce';

interface BottomMenuProps {
  shareButton: (e: React.MouseEvent<HTMLElement> | undefined) => void
  paintButton: (e: React.MouseEvent<HTMLElement> | undefined) => void
}

export const BottomMenu = ({ shareButton, paintButton }: BottomMenuProps) => {
  const { isLogged, loginApi } = useUser();
  const { queryPlace, activePixel, board, colors, activeColor, setActiveColor, times, activeTime, setActiveTime } = useCanvas();
  const screen = useBreakpoint();
  const debounceFunction = useDebounce();
  const params = new URLSearchParams(window.location.search);

  const [isLoading, setIsLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isImage, setIsImage] = useState(params.get('type') === 'image');
  const STEPS = useMemo(() => {
    return [
      ['none', undefined],
      ['hour', 3600],
      ['minute', 60],
      ['1/100', (times !== undefined ? (times.max - times.min) : 1) / 100],
    ];
  }, [times]);
  const [stepType, setStepType] = useState<number>(0);

  const { minText, currentText, maxText } = useMemo(() => {
    const minDate = times !== undefined && times.min || 0;
    const currentDate = activeTime;
    const maxDate = times !== undefined && times.max || 0;

    return { minText: dateIsoToNice(minDate), currentText: dateIsoToNice(currentDate), maxText: dateIsoToNice(maxDate) };
  }, [activeTime, times]);

  const setTime = useCallback((givenTime: number) => {
    setIsLoading(true);
    const isoTime = (new Date(givenTime)).toISOString();

    const params = new URLSearchParams(window.location.search);
    const args = objUrlEncode({
      ...Object.fromEntries(params),
      'time': isoTime,
    });

    const base = `${window.location.origin}${window.location.pathname}`;
    const link = `${base}?${args}`;
    window.history.replaceState(null, '', link);

    queryPlace(isoTime, params.get('type') ?? 'board', () => {
      setIsLoading(false);
    });
  }, [queryPlace]);

  const switchIsImage = useCallback((localIsImage: boolean) => {
    setIsLoading(true);
    const localType = !localIsImage ? 'image' : 'board';
    setIsImage((prev) => !prev);

    const params = new URLSearchParams(window.location.search);
    const args = objUrlEncode({
      ...Object.fromEntries(params),
      'type': localType,
    });

    const base = `${window.location.origin}${window.location.pathname}`;
    const link = `${base}?${args}`;
    window.history.replaceState(null, '', link);

    queryPlace(params.get('time') ?? undefined, localType, () => {
      setIsLoading(false);
    });
  }, [queryPlace]);

  const usernameDisplay = (username: string | undefined) => {
    if (username === undefined || ['null', 'Welcome', 'Guest'].includes(username)) {
      return username;
    }
    return <a href={`https://profile.intra.42.fr/users/${username}`}><u>{username}</u></a>;
  };

  return (
    <div className='fixed flex bottom-0 text-xs w-[80%] md:w-full md:text-base pointer-events-none'>
      <div className='mx-auto self-center grow max-w-[550px] bg-gray-400/90 pt-2 rounded-tr-lg md:rounded-t-lg flex flex-col pointer-events-auto'>
        <div className='text-black self-center w-full pl-2 pr-2 md:px-6 my-4 my-auto items-center flex flex-row gap-2'>
          {activePixel.x !== -1 &&
            <p className='h-fit whitespace-nowrap'>
              {activePixel.x}:{activePixel.y} set by {usernameDisplay(board.get(`${activePixel.x}:${activePixel.y}`)?.username)} at <br />
              {
                board.get(`${activePixel.x}:${activePixel.y}`) ?
                  dateIsoToNice(board.get(`${activePixel.x}:${activePixel.y}`)?.set_time || 0) :
                  ''
              }
            </p>
          }
          <div className='grow' />

          {isLogged && (
            (
              ['xs', 'sm'].includes(screen) && (
                <IconButton
                  onClick={paintButton}
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
                <IoIosShareAlt size={24} />
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
            <div className='self-center w-full p-2 grid grid-cols-9 justify-center gap-2'>
              {Array.from(colors.entries()).map((v) => {
                return (
                  <div key={v[0]}
                    title={v[1].name}
                    className={classNames('min-w-6 min-h-6 md:min-w-14 md:min-h-8 rounded border-2 hover:border-white', activeColor === v[0] ? 'border-white' : 'border-black')}
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
                <div className='px-4'>
                  <input
                    className={'w-full'}
                    type={'range'}
                    min={times.min}
                    max={times.max}
                    step={STEPS[stepType][1]}
                    defaultValue={activeTime}
                    onChange={(e) => {
                      debounceFunction(() => {
                        setActiveTime(parseInt(e.target.value));
                        if (isLive && !isLoading) {
                          setTime(activeTime);
                        }

                      }, isLive ? 200 : 0);
                    }}
                  />
                </div>
                <button
                  onClick={() => { setTime(activeTime); } }
                  className={classNames(
                    'min-w-20 h-8 px-2 mr-4 rounded bg-blue-400 border-2 border-black',
                    isLoading && 'bg-gray-400 pointer-none hover:border-black',
                    !isLoading && 'hover:border-white',
                  )}
                  disabled={isLoading}
                >
                  View
                </button>

                <button
                  onClick={() => {switchIsImage(isImage); } }
                  className={classNames(
                    'min-w-20 h-8 px-2 mr-4 rounded bg-blue-400 border-2 border-black',
                    isLoading && 'bg-gray-400 pointer-none hover:border-black',
                    !isLoading && 'hover:border-white',
                  )}
                >
                  {!isImage ? 'Switch to image' : 'Switch to canvas' }
                </button>

                <button
                  onClick={() => {setStepType((prev) => (prev + 1) % STEPS.length);}}
                  className={classNames(
                    'min-w-20 h-8 px-2 ml-4 rounded bg-blue-400 border-2 border-black hover:border-white',
                    isLive && 'bg-orange-700',
                  )}
                >
                  Step : {STEPS[stepType][0]}
                </button>

                <button
                  onClick={() => {setIsLive((prev) => !prev);}}
                  className={classNames(
                    'min-w-20 h-8 px-2 ml-4 rounded bg-blue-400 border-2 border-black hover:border-white',
                    isLive && 'bg-orange-700',
                  )}
                >
                  {!isLive ? 'Turn on live' : 'Turn off live' }
                </button>
              </div>
            </div>
          )
        }
      </div>
    </div>
  );
};
