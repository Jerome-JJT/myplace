
import { CANVAS_X, CANVAS_Y, MAX_SCALE, MIN_SCALE } from 'src/Utils/consts';
import { useUser } from 'src/UserProvider';
import { initScale, useCanvas } from './CanvasProvider';
import { map } from 'src/Utils/map';
import { useThrottle } from 'src/Utils/useThrottle';

export const canvasMarginTop = `${map(CANVAS_Y, 100, 1000, 500, 20)}px`;

export const DisplayCanvas = () => {
  const {
    pl,
    image,
    activePixel,
    overlayStyle,
    translate,
    scale,
    canvasCursorDown,
    canvasCursorMove,
    canvasCursorUp,
    canvasZoomed,
    setIsDragging,
    doZoom,
    canvasTouchMove,
    canvasTouchUp,
  } = useCanvas();
  const { infos, isConnected } = useUser();
  const throttleFunction = useThrottle();
  const params = new URLSearchParams(window.location.search);


  return (
    <>
      <canvas
        className='canvas_display'
        width={`${CANVAS_X}px`}
        height={`${CANVAS_Y}px`}
        style={{
          transform: `scale(${scale}) translate(${translate.x}px, ${translate.y}px)`,
          marginTop: canvasMarginTop,
          display:   (image === undefined ? 'block' : 'none'),
        }}
        ref={pl}

        onMouseDown={(e: React.MouseEvent<HTMLCanvasElement>) => {
          canvasCursorDown(-42, e.pageX, e.pageY);
          // canvasMouseMove(-42, e.pageX, e.pageY);
        }}
        onMouseMove={(e: React.MouseEvent<HTMLCanvasElement>) => {
          canvasCursorMove(-42, e.pageX, e.pageY);
        }}
        onMouseUp={(e: React.MouseEvent<HTMLCanvasElement>) => {
          canvasCursorUp(-42, e.pageX, e.pageY);
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
          if (e.touches.length === 1) {
            canvasCursorMove(e.touches[0].identifier, e.touches[0].pageX, e.touches[0].pageY);
          }
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          if (e.touches.length === 1) {
            canvasCursorMove(e.touches[0].identifier, e.touches[0].pageX, e.touches[0].pageY);
          }
          else if (e.touches.length === 2) {
            throttleFunction(() => {canvasTouchMove(e.touches[0], e.touches[1]);}, 50);
          }
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          canvasCursorUp(e.changedTouches[0].identifier, e.changedTouches[0].pageX, e.changedTouches[0].pageY);
          canvasTouchUp();
        }}
        onTouchCancel={() => {
          canvasTouchUp();
        }}

        onDoubleClick={(e: React.MouseEvent<HTMLCanvasElement>) => {
          if (scale > (MIN_SCALE + MAX_SCALE) / 2) {
            doZoom(e.pageX, e.pageY, initScale);
          }
          else {
            doZoom(e.pageX, e.pageY, MAX_SCALE);
          }
        }}
      >
      </canvas>

      {
        params.get('view') == null && activePixel.x !== -1 && (
          <>
            <div id="overlay" style={overlayStyle}></div>
            { infos?.soft_is_admin && (
              <div className='pointer-events-none absolute top-0 left-0 right-0 bottom-0 border-8 border-red-500' />
            )}
            { infos?.soft_is_admin && (
              <div className='pointer-events-none absolute top-0 text-center left-[20%] md:left-[42%] bg-red-500 p-4 rounded-b-lg'>
                <b>ADMIN MODE, WARNING</b>
              </div>
            )}
          </>
        )
      }

      {
        isConnected === false && (
          <div className='pointer-events-none absolute bottom-0 left-0 text-sm bg-orange-500 p-1 rounded-tr-lg'>
            <b>WS disconnected</b>
          </div>
        )
      }
    </>
  );
};