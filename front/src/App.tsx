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

  const quickFix = { placeholder: '', onPointerEnterCapture: () => {}, onPointerLeaveCapture: () => {} };

  return (
    <>
      <RouterProvider router={router} />

      <LoginBox />

      <NotificationContainer />

      <Tutorial />

      <div className="absolute bottom-0 right-0">
        <SpeedDial>
          <SpeedDialHandler>
            <IconButton className='w-12 !max-w-12 h-12 max-h-12 bg-gray-600 mb-4 mr-4 rounded-full' {...quickFix}>
              {/* <IoMdSettings size={32}/> */}
              <IoIosFiling size={32} />
            </IconButton>
          </SpeedDialHandler>
          <SpeedDialContent {...quickFix}>
            <SpeedDialAction {...quickFix} onClick={() => setTutoOpen(true)}>
              <IoMdHelpCircle color='black' />
            </SpeedDialAction>
            { (!isLogged && import.meta.env.VITE_NODE_ENV === 'DEV') && (
              <SpeedDialAction {...quickFix} onClick={loginButton}>
                <IoMdKey color='black' />
              </SpeedDialAction>
            )}
            { !isLogged && (
              <SpeedDialAction {...quickFix} onClick={loginApi}>
                <IoLogoIonitron color='black' />
              </SpeedDialAction>
            )}
            { isLogged && (
              <SpeedDialAction {...quickFix} onClick={logout}>
                <IoMdLock color='black' />
              </SpeedDialAction>
            )}
            <SpeedDialAction {...quickFix} onClick={() => router.navigate('/leaderboard')}>
              <IoMdPodium color='black' />
            </SpeedDialAction>
            <SpeedDialAction {...quickFix} onClick={() => router.navigate('/')}>
              <IoMdMap color='black' />
            </SpeedDialAction>
          </SpeedDialContent>
        </SpeedDial>
      </div>
    </>
  );
}

export default App;
