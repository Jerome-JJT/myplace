// import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from '@material-tailwind/react';
import { UserProvider } from './UserProvider.tsx';

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <ThemeProvider>
    <UserProvider>
      <App />
    </UserProvider>
  </ThemeProvider>,
  // </StrictMode>,
);
