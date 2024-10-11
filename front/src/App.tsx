import { useEffect } from 'react';
import './App.css';
import { Place } from './Place/Place';
import { useUser } from './UserProvider';

function App() {
  const { getUserData } = useUser();

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
