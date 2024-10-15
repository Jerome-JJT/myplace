import { useEffect } from 'react';
import './App.css';
import { Place } from './Place/Place';
import { useUser } from './UserProvider';
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
// import { IoMdSettings } from 'react-icons/io';
import { IoIosFiling, IoMdMap, IoMdPodium, IoLogoIonitron, IoMdLock, IoMdKey, IoMdHelpCircle } from 'react-icons/io';
import { Leaderboard } from './Leaderboard';
import { NotificationContainer } from './NotificationContainer';
import { Tutorial } from './Place/Tutorial';
import { QUICK_FIX } from './Utils/types';

function App() {
  const { isLogged, getUserData, loginButton, loginApi, logout, setTutoOpen } = useUser();

  useEffect(() => {
    getUserData();
  }, [getUserData]);

  const router = createBrowserRouter([
    {
      path:    '/',
      element: <Place />,
    },
    {
      path:    '/leaderboard/',
      element: <Leaderboard />,
    },
  ]);


  return (
    <>
      <RouterProvider router={router} />

      <LoginBox />

      <NotificationContainer />

      <Tutorial />

      <div className="absolute bottom-0 right-0">
        <SpeedDial>
          <SpeedDialHandler>
            <IconButton className='w-12 !max-w-12 h-12 max-h-12 bg-gray-600 mb-2 mr-2 md:mb-4 md:mr-4 rounded-full' {...QUICK_FIX}>
              <IoIosFiling size={32} />
            </IconButton>
          </SpeedDialHandler>
          <SpeedDialContent {...QUICK_FIX}>
            <SpeedDialAction {...QUICK_FIX} onClick={() => setTutoOpen(true)}>
              <IoMdHelpCircle color='black' />
            </SpeedDialAction>
            { (!isLogged && import.meta.env.VITE_NODE_ENV === 'DEV') && (
              <SpeedDialAction {...QUICK_FIX} onClick={loginButton}>
                <IoMdKey color='black' />
              </SpeedDialAction>
            )}
            { !isLogged && (
              <SpeedDialAction {...QUICK_FIX} onClick={loginApi}>
                <IoLogoIonitron color='black' />
              </SpeedDialAction>
            )}
            { isLogged && (
              <SpeedDialAction {...QUICK_FIX} onClick={logout}>
                <IoMdLock color='black' />
              </SpeedDialAction>
            )}
            <SpeedDialAction {...QUICK_FIX} onClick={() => router.navigate('/leaderboard')}>
              <IoMdPodium color='black' />
            </SpeedDialAction>
            <SpeedDialAction {...QUICK_FIX} onClick={() => router.navigate('/')}>
              <IoMdMap color='black' />
            </SpeedDialAction>
          </SpeedDialContent>
        </SpeedDial>
      </div>
    </>
  );
}

export default App;
