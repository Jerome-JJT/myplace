import { useCanvas } from './CanvasProvider';
import { MAX_SCALE, MIN_SCALE } from 'src/Utils/consts';

export const ZoomBar = () => {
  const { scale, setScale, } = useCanvas();

  return (
    <div className='fixed top-[5px] md:top-[20px] left-[5px] md:left-[20px]'>
      <div className='absolute flex gap-4 text-black p-1 w-fit rounded bg-gray-400/90'
        style={{
          transform: 'rotate(90deg)',
          transformOrigin: 'bottom left',
        }}>
        <p
          className={'w-4'}
          style={{
            transform: 'rotate(270deg)',
          }}>
          {scale}
        </p>
        <input
          className={'w-[40vh]'}
          style={{
            transform: 'rotate(180deg)',
            transformOrigin: 'center center',
          }}
          type={'range'}
          min={MIN_SCALE}
          max={MAX_SCALE}
          value={scale}
          onChange={(e) => {
            setScale(parseInt(e.target.value));
          }}
        />
      </div>
    </div>
  );
};
