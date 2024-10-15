import { useState, useEffect } from 'react';
import theme from 'tailwindcss/defaultTheme.js';

const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState('');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const breakpoints = theme.screens;

      if (width >= parseInt(breakpoints['2xl'])) {
        setBreakpoint('2xl');
      }
      else if (width >= parseInt(breakpoints.xl)) {
        setBreakpoint('xl');
      }
      else if (width >= parseInt(breakpoints.lg)) {
        setBreakpoint('lg');
      }
      else if (width >= parseInt(breakpoints.md)) {
        setBreakpoint('md');
      }
      else if (width >= parseInt(breakpoints.sm)) {
        setBreakpoint('sm');
      }
      else {
        setBreakpoint('xs');
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
};

export default useBreakpoint;
