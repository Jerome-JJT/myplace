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
  useNavigate,
} from 'react-router-dom';
// import { IoMdSettings } from 'react-icons/io';
import { IoIosFiling, IoMdMap, IoMdPodium } from 'react-icons/io';
import { Leaderboard } from './Leaderboard';

function App() {
  const { getUserData, loginButton } = useUser();

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
      <LoginBox loginButton={loginButton} />
      <RouterProvider router={router} />

      <div className="absolute bottom-0 right-0">
        <SpeedDial>
          <SpeedDialHandler>
            <IconButton className='w-12 max-w-12 h-12 max-h-12 bg-gray-600 mb-4 mr-4 rounded-3xl' {...quickFix}>
              {/* <IoMdSettings size={32}/> */}
              <IoIosFiling size={32} />
            </IconButton>
          </SpeedDialHandler>
          <SpeedDialContent {...quickFix}>
            <SpeedDialAction {...quickFix} onClick={loginButton}>
              Login
            </SpeedDialAction>
            <SpeedDialAction {...quickFix} onClick={() => router.navigate('/leaderboard')}>
              <IoMdPodium />
            </SpeedDialAction>
            <SpeedDialAction {...quickFix} onClick={() => router.navigate('/')}>
              <IoMdMap />
            </SpeedDialAction>
          </SpeedDialContent>
        </SpeedDial>
      </div>
    </>
  );
}

export default App;
