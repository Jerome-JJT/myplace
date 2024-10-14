import axios from 'axios';
import { useContext, type ReactNode, createContext, useCallback, useState } from 'react';
import { UserInfos } from './Utils/types';

interface UserContextProps {
  isLogged: boolean
  infos: UserInfos | undefined
  getUserData: () => void
  setPixelInfos: (timers: string[]) => void
  logout: () => void
  loginButton: (e: React.MouseEvent<HTMLElement> | undefined) => void
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

  const setPixelInfos = useCallback((timers: string[]) => {
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


  const loginButton = useCallback((e: React.MouseEvent<HTMLElement> | undefined) => {
    e?.currentTarget.blur();
    const username = prompt('Username');

    if (username && username.length > 3) {
      axios
        .post('/api/mocklogin',
          {
            username: username,
          },
          { withCredentials: true },
        )
        .then(() => {
          getUserData();
        })
        .catch(() => {
        });
    }
  }, [getUserData]);

  return (
    <UserContext.Provider
      value={{
        isLogged,
        infos,
        getUserData,
        setPixelInfos,
        logout,
        loginButton,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
