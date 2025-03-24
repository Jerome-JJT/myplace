import axios from 'axios';
import { useCallback } from 'react';
import classNames from 'classnames';
import { useNotification } from './NotificationProvider';


export const Account = () => {
  const { addNotif } = useNotification();

const invalidateButton = useCallback((e: React.MouseEvent<HTMLElement> | undefined) => {
    e?.currentTarget.blur();

    axios
      .get('/api/rotate_tokens',
        { withCredentials: true },
      )
      .then((res) => {
        if (res.status === 200) {
          addNotif('Success, you will soon be disconnected', 'success');
        }
      })
      .catch((error) => {
        addNotif(`${error.response.status} ${error.response.message || error.response.statusText}`, 'error');
      });
  }, []);


  return (
    <div className='rounded-md ml-[10vw] md:mx-auto w-[80vw] md:max-w-[500px] mt-[5vh] bg-red-400 py-2'>

      <h2>Account management</h2>

      <hr />

      <div className='py-2 m-5'>
        Download my board (available only after the end): 
        <button
          className={classNames('ml-1 px-1 bg-gray-700/90 rounded border-2 border-black text-white hover:text-white hover:border-white')}
          onClick={() => window.location.href='/api/myboard'}
        >
          Download white background
        </button>

        <button
          className={classNames('ml-1 px-1 bg-gray-700/90 rounded border-2 border-black text-white hover:text-white hover:border-white')}
          onClick={() => window.location.href='/api/myboard?transparent=true'}
        >
          Download transparent
        </button>
      </div>

      <hr />

      <div className='py-2 m-5'>
        Invalidate my refresh tokens:
        <button
          className={classNames('ml-1 px-1 bg-gray-700/90 rounded border-2 border-black hover:border-white')}
          onClick={invalidateButton}
        >
          Invalidate
        </button>
      </div>
    </div>
  );
};
