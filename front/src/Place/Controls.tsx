import { useEffect } from 'react';

interface ControlsProps {
    onMove: (x: number, y: number) => void
    onAction: () => void
    onNumeric: (abs: number | undefined, rel: number | undefined) => void
}

export const Controls = ({ onMove, onAction, onNumeric }: ControlsProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const keyCode = event.code;

      // console.log(keyCode);

      if (keyCode === 'ArrowUp' || keyCode === 'KeyW') {
        onMove(0, -1);
      }
      if (keyCode === 'ArrowLeft' || keyCode === 'KeyA') {
        onMove(-1, 0);
      }
      if (keyCode === 'ArrowDown' || keyCode === 'KeyS') {
        onMove(0, 1);
      }
      if (keyCode === 'ArrowRight' || keyCode === 'KeyD') {
        onMove(1, 0);
      }
      if (keyCode === 'Space' || keyCode === 'Enter') {
        onAction();
      }

      if (keyCode.startsWith('Digit') || keyCode.startsWith('Numpad')) {
        // console.log(keyCode.substring(keyCode.length - 1));
        onNumeric(parseInt(keyCode.substring(keyCode.length -1)), undefined);
      }
      if (keyCode === 'Tab') {
        event.preventDefault();
        onNumeric(undefined, +1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onAction, onMove, onNumeric]);

  return <></>;
};
