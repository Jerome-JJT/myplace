import axios from 'axios';
import { useContext, type ReactNode, createContext, useCallback, useState } from 'react';

export interface LoggedUser {
  id: number
  username: string

  timers: Date[]
  pixel_buffer: number
  pixel_timer: number
}

interface LoginContextProps {
  isLogged: boolean
  userInfos: LoggedUser | undefined
  getUserData: () => void
  setPixelInfos: (timers: Date[]) => void
  logout: () => void
}

const LoginContext = createContext<LoginContextProps | undefined>(undefined);

export function useLogin(): LoginContextProps {
  const context = useContext(LoginContext);
  if (!context) {
    throw new Error('useLogin must be used within a LoginProvider');
  }
  return context;
}

export function LoginProvider({ children }: { children: ReactNode }): JSX.Element {
  const [isLogged, setIsLogged] = useState(false);
  const [userInfos, setUserInfos] = useState<LoggedUser | undefined>();

  const getUserData = useCallback(() => {
    axios
      .get('/api/profile',
        { withCredentials: true },
      )
      .then((res) => {
        if (res.status === 200) {
          setIsLogged(true);
          setUserInfos(res.data.userInfos as LoggedUser);
        }
      })
      .catch(() => {
        setIsLogged(false);
        setUserInfos({} as LoggedUser);
      });
  }, []);

  const setPixelInfos = useCallback((timers: Date[]) => {
    if (isLogged) {
      setUserInfos((prev) => {
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
          setUserInfos({} as LoggedUser);
        }
      })
      .catch(() => {
      });
  }, []);

  return (
    <LoginContext.Provider
      value={{
        isLogged,
        userInfos,
        getUserData,
        setPixelInfos,
        logout,
      }}
    >
      {children}
    </LoginContext.Provider>
  );
}
