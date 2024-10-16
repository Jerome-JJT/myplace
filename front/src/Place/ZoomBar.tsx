import { useCanvas } from './CanvasProvider';
import { MAX_SCALE, MIN_SCALE } from 'src/Utils/consts';

export const ZoomBar = () => {
  const { scale, setScale } = useCanvas();

  return (
    <div className='fixed flex gap-4 text-black top-[220px] md:top-[50%] left-[-190px] md:left-[-180px] p-1 rounded bg-gray-400/90'
      style={{
        transform:       'rotate(270deg)',
        transformOrigin: 'center center',
      }}>

      <input
        className={'w-[400px]'}
        style={{
        }}
        type={'range'}
        min={MIN_SCALE}
        max={MAX_SCALE}
        value={scale}
        onChange={(e) => {
          setScale(parseInt(e.target.value));
        }}
      />
      <p
        className={'w-4'}
        style={{
          transform:       'rotate(90deg)',
          transformOrigin: '30% 33%',
        }}>
        {scale}
      </p>
    </div>
  );
};
