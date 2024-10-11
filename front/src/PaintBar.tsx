import { useUser } from './UserProvider';

export const PaintBar = () => {
  const { isLogged, infos } = useUser();

  return (
    isLogged && (
      <div className='fixed flex flex-col justify-center top-0 right-4 h-[100%] w-12 pointer-events-none'>
        <div className='p-1 rounded bg-gray-400/70'>
          <div className='whitespace-nowrap'>{(infos?.pixel_buffer || 1) - (infos?.timers.length || 1)}</div>

          <div className='flex flex-col bg-red-500 h-80'>
            <div className='grow' />
            <div
              className='bg-cyan-500'
              style={{
                height: `${(infos?.timers.length || 1) / (infos?.pixel_buffer || 1) * 100}%`,
              }}>
            </div>
          </div>
        </div>
      </div>
    )
  );
};
