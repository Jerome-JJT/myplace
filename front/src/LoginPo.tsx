import { useEffect } from 'react';
import { useUser } from './UserProvider';
import classNames from 'classnames';
import { OAUTH2_DISPLAY_NAME } from './Utils/consts';

export const LoginPo = () => {
  const { isLogged, loginApi, loginPo } = useUser();

  useEffect(() => {
    if (isLogged) {
      window.location.href = '/';
    }
  }, [isLogged]);

  return (
    <div className='text-md text-white rounded-[50px] mx-auto mt-[10vh] bg-[#008080]/70 mx-3 pt-4 pb-10'>

      <h1>Welcome</h1>
      <br />

      <button
        className={classNames(
          'w-[60%] h-24 bg-white text-black p-2 bg-gray-400/90 rounded-[30px] border-4 border-black',
          'hover:border-white hover:bg-gray-600 my-2',
        )}
        onClick={loginPo}
      >
        Login portes ouvertes
      </button>

      <hr />

      <h4 className="mt-4">Étudiants only : </h4>
      <button
        className={classNames(
          'w-[60%] h-24 bg-white text-black p-2 bg-gray-400/90 rounded-[30px] border-4 border-black',
          'hover:border-white hover:bg-gray-600 my-2',
        )}
        onClick={loginApi}
      >
        {OAUTH2_DISPLAY_NAME}
      </button>
    </div>
  );
};
