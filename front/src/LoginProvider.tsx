import axios from 'axios';
import { useContext, type ReactNode, createContext, useCallback, useState } from 'react';

export interface LoggedUser {
  id: number
  username: string
}

interface LoginContextProps {
  isLogged: boolean
  userInfos: LoggedUser | undefined
  getUserData: () => void
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
          setUserInfos(res.data as LoggedUser);
        }
      })
      .catch((error) => {
        setIsLogged(false);
        setUserInfos({} as LoggedUser);
      });
  }, []);

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
      .catch((error) => {
      });
  }, []);

  return (
    <LoginContext.Provider
      value={{
        isLogged,
        userInfos,
        getUserData,
        logout,
      }}
    >
      {children}
    </LoginContext.Provider>
  );
}
