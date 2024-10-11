// import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from '@material-tailwind/react';
import { UserProvider } from './UserProvider.tsx';
import { CanvasProvider } from './Place/CanvasProvider.tsx';

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <ThemeProvider>
    <UserProvider>
      <CanvasProvider>
        <App />
      </CanvasProvider>
    </UserProvider>
  </ThemeProvider>,
  // </StrictMode>,
);
