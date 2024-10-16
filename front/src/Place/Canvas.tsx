
import { CANVAS_X, CANVAS_Y, MAX_SCALE, MIN_SCALE } from 'src/Utils/consts';
import { useUser } from 'src/UserProvider';
import { baseScale, useCanvas } from './CanvasProvider';
import { map } from 'src/Utils/map';
import { useNotification } from 'src/NotificationProvider';
import { useRef } from 'react';

const canvasMarginTop = `${map(CANVAS_Y, 100, 1000, 500, 20)}px`;


const useThrottle = () => {
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


export const DisplayCanvas = () => {
  const {
    pl,
    activePixel,
    overlayStyle,
    translate,
    scale,
    canvasMouseDown,
    canvasMouseMove,
    canvasMouseUp,
    canvasZoomed,
    canvasClicked,
    setIsDragging,
    doZoom,
    canvasTouchMove,
    canvasTouchUp,
  } = useCanvas();
  const { infos } = useUser();

  const { addNotif } = useNotification();
  const throttleFunction = useThrottle();

  return (
    <>
      <canvas
        width={`${CANVAS_X}px`}
        height={`${CANVAS_Y}px`}
        style={{
          transform: `scale(${scale}) translate(${translate.x}px, ${translate.y}px)`,
          marginTop: canvasMarginTop,
        }}
        ref={pl}

        onMouseDown={(e: React.MouseEvent<HTMLCanvasElement>) => {
          canvasMouseDown(-42, e.pageX, e.pageY);
          // canvasMouseMove(-42, e.pageX, e.pageY);
        }}
        onMouseMove={(e: React.MouseEvent<HTMLCanvasElement>) => {
          canvasMouseMove(-42, e.pageX, e.pageY);
        }}
        onMouseUp={(e: React.MouseEvent<HTMLCanvasElement>) => {
          canvasMouseUp(-42, e.pageX, e.pageY);
        }}
        onWheel={(e: React.WheelEvent<HTMLCanvasElement>) => {
          e.stopPropagation();
          canvasZoomed(e.pageX, e.pageY, e.deltaY);
        }}
        onMouseLeave={() => {
          setIsDragging(0);
        }}

        onTouchStart={(e) => {
          e.preventDefault();
          console.log('start', e.changedTouches);
          if (e.touches.length === 1) {
            // canvasMouseDown(e.touches[0].identifier, e.touches[0].pageX, e.touches[0].pageY);
            canvasMouseMove(e.touches[0].identifier, e.touches[0].pageX, e.touches[0].pageY);
          }
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          console.log('move', e.changedTouches);
          // addNotif(`${e.touches.length}`, 'info');
          if (e.touches.length === 1) {
            canvasMouseMove(e.touches[0].identifier, e.touches[0].pageX, e.touches[0].pageY);
          }
          else if (e.touches.length === 2) {


            throttleFunction(() => {canvasTouchMove(e.touches[0], e.touches[1]);}, 50);

          }
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          // console.log('end', e);
          // addNotif(`${e.changedTouches.length}`, 'error');
          // if (e.changedTouches.length === 1) {
          canvasMouseUp(e.changedTouches[0].identifier, e.changedTouches[0].pageX, e.changedTouches[0].pageY);
          // }
          // else if (e.changedTouches.length === 2) {
          canvasTouchUp();
          // }
        }}

        onTouchCancel={() => {
          canvasTouchUp();
        }}

        onDoubleClick={(e: React.MouseEvent<HTMLCanvasElement>) => {
          if (scale > (MIN_SCALE + MAX_SCALE) / 2) {
            doZoom(e.pageX, e.pageY, baseScale);
          }
          else {
            doZoom(e.pageX, e.pageY, MAX_SCALE);
          }
        }}
      >
      </canvas>

      {activePixel.x !== -1 && <div id="overlay" style={overlayStyle}></div>}

      { infos?.soft_is_admin && (
        <div className='pointer-events-none absolute top-0 left-0 right-0 bottom-0 border-8 border-red-500' />
      )}
      { infos?.soft_is_admin && (
        <div className='pointer-events-none absolute top-0 text-center left-[20%] md:left-[42%] bg-red-500 p-4 rounded-b-lg'>
          <b>ADMIN MODE, WARNING</b>
        </div>
      )}
    </>
  );
};