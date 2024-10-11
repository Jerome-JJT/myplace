import { useEffect } from 'react';
import './App.css';
import { Place } from './Place';
import { useLogin } from './LoginProvider';

function App() {
  const { getUserData } = useLogin();

  useEffect(() => {
    getUserData();
  }, [getUserData]);

  return (
    <>
      <Place />
    </>
  );
}

export default App;
