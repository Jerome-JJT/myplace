interface PaintBarProps {
    pixel_buffer: number | undefined,
    timers: Date[] | undefined
}

export const PaintBar = ({ pixel_buffer, timers }: PaintBarProps) => {
  return (
    <div className='fixed flex flex-col justify-center top-0 right-4 h-[100%] w-12 pointer-events-none'>
      <div className='p-1 rounded bg-gray-400/70'>
        <div className='whitespace-nowrap'>{(pixel_buffer || 1) - (timers?.length || 1)}</div>

        <div className='flex flex-col bg-red-500 h-80'>
          <div className='grow' />
          <div
            className='bg-cyan-500'
            style={{
              height: `${(timers?.length || 1) / (pixel_buffer || 1) * 100}%`,
            }}>
          </div>
        </div>
      </div>
    </div>
  );
};
