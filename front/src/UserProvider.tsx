import axios from 'axios';
import { useContext, type ReactNode, createContext, useCallback, useState } from 'react';
import { UserInfos } from './types';

interface UserContextProps {
  isLogged: boolean
  infos: UserInfos | undefined
  getUserData: () => void
  setPixelInfos: (timers: Date[]) => void
  logout: () => void
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export function useUser(): UserContextProps {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export function UserProvider({ children }: { children: ReactNode }): JSX.Element {
  const [isLogged, setIsLogged] = useState(false);
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
        }
      })
      .catch(() => {
        setIsLogged(false);
        setInfos({} as UserInfos);
      });
  }, []);

  const setPixelInfos = useCallback((timers: Date[]) => {
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
        if (res.status === 204) {
          setIsLogged(false);
          setInfos({} as UserInfos);
        }
      })
      .catch(() => {
      });
  }, []);

  return (
    <UserContext.Provider
      value={{
        isLogged,
        infos,
        getUserData,
        setPixelInfos,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
