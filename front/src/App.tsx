import './App.css';
import { useEffect } from 'react';
import axios from 'axios';

import { Place } from './Place/Place';
import { useUser } from './UserProvider';
import { useNotification } from './NotificationProvider';
import { LoginBox } from './Place/LoginBox';
import {
  SpeedDial,
  SpeedDialHandler,
  SpeedDialContent,
  SpeedDialAction,
  IconButton,
} from '@material-tailwind/react';
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';
import { IoIosFiling, IoMdMap, IoMdPodium, IoLogoIonitron, IoMdLock, IoMdKey, IoMdHelpCircle, IoMdPerson } from 'react-icons/io';
import { NotificationContainer } from './NotificationContainer';
import { Tutorial } from './Place/Tutorial';
import { QUICK_FIX } from './Utils/types';
import { LoginPo } from './LoginPo';
import { Account } from './Account';
import { Leaderboard } from './Leaderboard';
import { DEV_MODE, ENABLE_GUEST_LOGIN, ENABLE_OAUTH2_LOGIN, OAUTH2_DISPLAY_NAME } from './Utils/consts';

function App() {
  const { isLogged, getUserData, loginButton, loginApi, logout, setTutoOpen } = useUser();
  const { addNotif } = useNotification();
  const params = new URLSearchParams(window.location.search);

  useEffect(() => {
    getUserData();
  }, [getUserData]);

  const router = createBrowserRouter([
    {
      path:    '/',
      element: <Place />,
    },
    {
      path:    '/account/',
      element: <Account />,
    },
    {
      path:    '/leaderboard/',
      element: <Leaderboard />,
    },
    ENABLE_GUEST_LOGIN ? {
      path:    '/loginpo/',
      element: <LoginPo />,
    } : {},
    ENABLE_GUEST_LOGIN ? {
      path:    '/pologin/',
      element: <LoginPo />,
    } : {},
  ]);

  axios.interceptors.request.use(
    (req) => {
      // req.baseURL = '/api';
      // req.meta.requestStartedAt = new Date().getTime();
      return req;
    });

  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      const retries = error.config?.retry ?? 0;

      if (error.response.status === 426 && retries === 0) {
        return axios({ ...error.config, retry: retries + 1 });
      }
      else if (error.response.status === 409) {
        addNotif('Forbidden: Reason: Banned', 'error');
      }
      else if (error.response.status === 401 && isLogged) {
        logout();
      }

      return Promise.reject(error);
    },
  );

  return (
    <>
      <RouterProvider router={router} />

      {
        params.get('ads') != null && (
          <>
            <div className='absolute top-0 text-center left-[42%] md:left-[28%] bg-white text-blue-400 text-6xl p-6 rounded-b-lg'>
              <u>{window.location.href}</u>
            </div>
            <div className='absolute bg-white text-black text-2xl p-1 top-0 left-0'>
              <img src="/qr.png" width="300px" />
              Participate !
            </div>
            <div className='absolute bg-white text-black text-2xl p-1 bottom-0 left-0'>
              Participate !
              <img src="/qr.png" width="300px" />
            </div>
            <div className='absolute bg-white text-black text-2xl p-1 top-0 right-0'>
              <img src="/qr.png" width="300px" />
              Participate !
            </div>
            <div className='absolute bg-white text-black text-2xl p-1 bottom-0 right-0'>
              Participate !
              <img src="/qr.png" width="300px" />
            </div>
          </>
        )
      }

      {
        (params.get('view') == null && !window.location.href.includes('loginpo')) && (
          <>
            <LoginBox onLoggedClick={() => router.navigate('/account')} />

            <NotificationContainer />

            <Tutorial />

            <div className="absolute bottom-0 right-0">
              <SpeedDial>
                <SpeedDialHandler>
                  <IconButton className='w-12 !max-w-12 h-12 max-h-12 bg-gray-600 mb-2 mr-2 md:mb-4 md:mr-4 rounded-full' {...QUICK_FIX}>
                    <IoIosFiling size={32} />
                  </IconButton>
                </SpeedDialHandler>
                <SpeedDialContent className='gap-0' {...QUICK_FIX}>
                  <SpeedDialAction className='text-black text-xs w-12 h-12 mb-2 gap-0' {...QUICK_FIX} onClick={() => setTutoOpen(true)}>
                    <IoMdHelpCircle size={20} color='black' />
                    Tuto
                  </SpeedDialAction>
                  { (!isLogged && DEV_MODE === true) && (
                    <SpeedDialAction className='text-black text-xs w-12 h-12 mb-2  gap-0' {...QUICK_FIX} onClick={loginButton}>
                      <IoMdKey size={20} color='black' />
                      Dev login
                    </SpeedDialAction>
                  )}
                  { !isLogged && ENABLE_OAUTH2_LOGIN && (
                    <SpeedDialAction className='text-black text-xs w-12 h-12 mb-2 gap-0' {...QUICK_FIX} onClick={loginApi}>
                      <IoLogoIonitron size={20} color='black' />
                      {OAUTH2_DISPLAY_NAME}
                    </SpeedDialAction>
                  )}
                  { isLogged && (
                    <SpeedDialAction className='text-black text-xs w-12 h-12 mb-2 gap-0' {...QUICK_FIX} onClick={logout}>
                      <IoMdLock size={20} color='black' />
                      Exit
                    </SpeedDialAction>
                  )}
                  { isLogged && (
                    <SpeedDialAction className='text-black text-xs w-12 h-12 mb-2 gap-0' {...QUICK_FIX} onClick={() => router.navigate('/account')}>
                      <IoMdPerson size={20} color='black' />
                      Account
                    </SpeedDialAction>
                  )}
                  <SpeedDialAction className='text-black text-xs w-12 h-12 mb-2 gap-0' {...QUICK_FIX} onClick={() => router.navigate('/leaderboard')}>
                    <IoMdPodium size={20} color='black' />
                    Stats
                  </SpeedDialAction>
                  <SpeedDialAction className='text-black text-xs w-12 h-12 mb-2 gap-0' {...QUICK_FIX} onClick={() => router.navigate('/')}>
                    <IoMdMap size={20} color='black' />
                    Map
                  </SpeedDialAction>
                </SpeedDialContent>
              </SpeedDial>
            </div>
          </>
        )
      }
    </>
  );
}

export default App;
