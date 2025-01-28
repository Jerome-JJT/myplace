import classNames from 'classnames';

import { useUser } from 'src/UserProvider';
import { useCanvas } from './CanvasProvider';


export const LoginBox = () => {
  const { isLogged, infos, loginApi } = useUser();
  const { nbConnecteds } = useCanvas();

  return (
    <div className='fixed flex top-0 right-0'>
      <span className={classNames('px-1 h-8 bg-gray-400/50 rounded border-2 border-black')}>
        {nbConnecteds} connected {nbConnecteds === 1 ? 'user' : 'users'}
      </span>
      <button
        className={classNames('p-2 bg-gray-400/90 rounded border-2 border-black hover:border-white')}
        onClick={loginApi}
      >
        { isLogged && infos?.username || '<Login>' }
      </button>
    </div>
  );
};
