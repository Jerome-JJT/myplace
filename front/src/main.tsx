import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from '@material-tailwind/react';
import { LoginProvider } from './LoginProvider.tsx';

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <ThemeProvider>
    <LoginProvider>
      <App />
    </LoginProvider>
  </ThemeProvider>,
  // </StrictMode>,
);
