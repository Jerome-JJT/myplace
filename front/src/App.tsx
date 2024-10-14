import { useEffect } from 'react';
import './App.css';
import { Place } from './Place/Place';
import { useUser } from './UserProvider';
import { LoginBox } from './Place/LoginBox';

function App() {
  const { getUserData, loginButton } = useUser();

  useEffect(() => {
    getUserData();
  }, [getUserData]);

  return (
    <>
      <LoginBox loginButton={loginButton} />
      <Place />
    </>
  );
}

export default App;
