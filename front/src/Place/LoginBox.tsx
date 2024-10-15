import classNames from 'classnames';

import { useUser } from 'src/UserProvider';


export const LoginBox = () => {
  const { isLogged, infos, loginApi } = useUser();

  return (
    <div className='fixed flex top-0 right-0'>
      <button
        className={classNames('p-2 bg-gray-500 rounded border-2 border-black hover:border-white')}
        onClick={loginApi}
      >
        { isLogged && infos?.username || '<Login>' }
      </button>
    </div>
  );
};
