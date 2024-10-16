// https://medium.com/@shubham3480/debouncing-and-throttling-in-react-e71c711fc6c5
import { useRef } from 'react';

export const useDebounce = () => {
  const debounceSeed = useRef<NodeJS.Timeout | null>(null);

  const debounceFunction = useRef((func: any, timeout = 200) => {
    if (debounceSeed.current) {
      clearTimeout(debounceSeed.current);
      debounceSeed.current = null;
    }
    debounceSeed.current = setTimeout(() => {
      func();
    }, timeout);
  });

  return debounceFunction.current;
};