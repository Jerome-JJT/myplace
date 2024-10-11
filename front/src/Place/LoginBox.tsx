import classNames from 'classnames';

import { useUser } from 'src/UserProvider';

interface LoginBoxProps {
  loginButton: () => void
}

export const LoginBox = ({ loginButton }: LoginBoxProps) => {
  const { isLogged, infos } = useUser();

  return (
    <div className='fixed flex top-0 right-0'>
      <button
        className={classNames('p-2 bg-gray-500 rounded border-2 border-black hover:border-white')}
        onClick={loginButton}
      >
        { isLogged && infos?.username || '<Login>' }
      </button>
    </div>
  );
};
