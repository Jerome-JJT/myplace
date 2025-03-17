import axios from 'axios';
import { useContext, type ReactNode, createContext, useCallback, useState } from 'react';
import { UserInfos } from './Utils/types';
import { useNotification } from './NotificationProvider';

interface UserContextProps {
  isLogged: boolean
  isConnected: boolean
  setIsConnected: React.Dispatch<React.SetStateAction<boolean>>
  tutoOpen: boolean
  setTutoOpen: React.Dispatch<React.SetStateAction<boolean>>
  infos: UserInfos | undefined
  getUserData: () => void
  setPixelInfos: (timers: number[]) => void
  logout: () => void
  loginButton: (e: React.MouseEvent<HTMLElement> | undefined) => void
  loginApi: (e: React.MouseEvent<HTMLElement> | undefined) => void
  loginPo: (e: React.MouseEvent<HTMLElement> | undefined) => void
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export function useUser(): UserContextProps {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

const baseTutoState = () => {
  const base = localStorage.getItem('tuto');
  if (base === null) {
    localStorage.setItem('tuto', 'yes');
    return true;
  }
  else {
    return false;
  }
};

export function UserProvider({ children }: { children: ReactNode }): JSX.Element {
  const { addNotif } = useNotification();
  const [isLogged, setIsLogged] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [tutoOpen, setTutoOpen] = useState(baseTutoState);
  const [infos, setInfos] = useState<UserInfos | undefined>();

  const getUserData = useCallback(() => {
    axios
      .get('/api/profile',
        { withCredentials: true },
      )
      .then((res) => {
        if (res.status === 200) {
          setIsLogged(true);
          setInfos(res.data.userInfos as UserInfos);
          addNotif(`Welcome ${(res.data.userInfos as UserInfos).username} !`, 'success');
        }
      })
      .catch(() => {
        setIsLogged(false);
        setInfos({} as UserInfos);
        // addNotif('Login failed', 'error');
      });
  }, [addNotif]);

  const setPixelInfos = useCallback((timers: number[]) => {
    if (isLogged) {
      setInfos((prev) => {
        if (prev) {
          return {
            ...prev,
            timers: timers,
          };
        }
        return prev;
      });
    }
  }, [isLogged]);

  const logout = useCallback(() => {
    axios
      .get('/api/logout',
        { withCredentials: true },
      )
      .then((res) => {
        if (res.status === 200) {
          setIsLogged(false);
          setInfos({} as UserInfos);
          addNotif('Logout success', 'success');
        }
      })
      .catch(() => {
      });
  }, [addNotif]);


  const loginButton = useCallback((e: React.MouseEvent<HTMLElement> | undefined) => {
    e?.currentTarget.blur();

    axios
      .post('/api/login/mock',
        {},
        { withCredentials: true },
      )
      .then(() => {
        getUserData();
        addNotif('Mock login success', 'success');
      })
      .catch(() => {
        addNotif('Mock login error', 'error');
      });
  }, [getUserData]);

  const loginApi = useCallback((e: React.MouseEvent<HTMLElement> | undefined) => {
    e?.currentTarget.blur();
    window.location.href = '/api/login/api';
  }, []);

  const loginPo = useCallback((e: React.MouseEvent<HTMLElement> | undefined) => {
    e?.currentTarget.blur();
    window.location.href = '/api/login/po';
  }, []);

  return (
    <UserContext.Provider
      value={{
        isLogged,
        isConnected,
        setIsConnected,
        tutoOpen,
        setTutoOpen,
        infos,
        getUserData,
        setPixelInfos,
        logout,
        loginButton,
        loginApi,
        loginPo,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
