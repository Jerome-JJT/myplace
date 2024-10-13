import classNames from 'classnames';

import { useUser } from 'src/UserProvider';
import { useCanvas } from './CanvasProvider';

interface BottomMenuProps {
  loginButton: (e: React.MouseEvent<HTMLElement> | undefined) => void
  shareButton: (e: React.MouseEvent<HTMLElement> | undefined) => void
  paintButton: (e: React.MouseEvent<HTMLElement> | undefined) => void
}

export const BottomMenu = ({ loginButton, shareButton, paintButton }: BottomMenuProps) => {
  const { isLogged } = useUser();
  const { activePixel, board, colors, activeColor, setActiveColor, times } = useCanvas();

  return (
    <div className='fixed flex bottom-0 w-full pointer-events-none'>
      <div id='menu' className='mx-auto self-center bg-red-500 flex flex-col pointer-events-auto'>
        <div className='self-center my-4 my-auto items-center flex flex-row gap-4'>
          {activePixel.x !== -1 &&
            <p className='h-fit'>
              Set by {board.get(`${activePixel.x}:${activePixel.y}`)?.username} at {
                board.get(`${activePixel.x}:${activePixel.y}`) ? (new Date(board.get(`${activePixel.x}:${activePixel.y}`)?.set_time || '')).toISOString() : ''
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
              onClick={loginButton}
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
            ) || (
              <div>
               <input
                  className={'w-[400px]'}
                  // style={{
                  // }}
                  type={'range'}
                  min={times?.min}
                  max={times?.max}
                  // value={scale}
                  // onChange={(e) => {
                  //   setScale(parseInt(e.target.value));
                  // }}
                />
                <button className={classNames('w-14 h-8 rounded border-2 hover:border-white', activeColor === v[0] ? 'border-white' : 'border-black')}
                >View</button>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
};
