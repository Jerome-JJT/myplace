// https://medium.com/@shubham3480/debouncing-and-throttling-in-react-e71c711fc6c5
import { useRef } from 'react';

export const useThrottle = () => {
  const throttleSeed = useRef<NodeJS.Timeout | null>(null);

  const throttleFunction = useRef((func: any, delay=200) => {
    if (!throttleSeed.current) {
      func();
      throttleSeed.current = setTimeout(() => {
        throttleSeed.current = null;
      }, delay);
    }
  });

  return throttleFunction.current;
};
