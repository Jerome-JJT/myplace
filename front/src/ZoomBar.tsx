import { MAX_SCALE, MIN_SCALE } from './consts';

interface ZoomBarProps {
  scale: number
  setScale: React.Dispatch<React.SetStateAction<number>>,
}

export const ZoomBar = ({ scale, setScale }: ZoomBarProps) => {
  return (
    <div className='fixed flex gap-4 text-black top-[50%] left-[-180px] p-1 rounded bg-gray-400/70'
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
        style={{
          transform:       'rotate(90deg)',
          transformOrigin: 'center center',
        }}>
        {scale}
      </p>
    </div>
  );
};
