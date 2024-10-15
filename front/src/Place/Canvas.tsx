
import { CANVAS_X, CANVAS_Y, MAX_SCALE, MIN_SCALE } from 'src/Utils/consts';
import { useUser } from 'src/UserProvider';
import { baseScale, useCanvas } from './CanvasProvider';
import { map } from 'src/Utils/map';

const canvasMarginTop = `${map(CANVAS_Y, 100, 1000, 500, 20)}px`;

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
    setIsDragging,
    doZoom,
  } = useCanvas();
  const { infos } = useUser();


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
          canvasMouseDown(e.pageX, e.pageY);
        }}
        onMouseMove={(e: React.MouseEvent<HTMLCanvasElement>) => {
          canvasMouseMove(e.pageX, e.pageY);
        }}
        onMouseUp={(e: React.MouseEvent<HTMLCanvasElement>) => {
          canvasMouseUp(e.pageX, e.pageY);
        }}
        onWheel={(e: React.WheelEvent<HTMLCanvasElement>) => {
          e.stopPropagation();
          canvasZoomed(e.pageX, e.pageY, e.deltaY);
        }}
        onMouseLeave={() => {
          setIsDragging(0);
        }}

        // onTouchStart={(e) => {
        //   e.preventDefault();
        //   console.log('start')
        //   // console.log('start', e.touches)
        //   canvasMouseDown(e.touches[0].screenX, e.touches[0].screenY)
        // }}
        // onTouchMove={(e) => {
        //   e.preventDefault();
        //   console.log('move')
        //   // console.log('move', e.touches)
        //   canvasMouseMove(e.touches[0].screenX, e.touches[0].screenY)
        // }}
        // onTouchEnd={(e) => {
        //   // e.preventDefault();
        //   console.log('end', e.changedTouches[0].screenX, e.changedTouches[0].screenY)
        //   // console.log('end', e.touches, e)
        //   // canvasMouseUp(e.changedTouches[0].screenX, e.changedTouches[0].screenY)
        // }}

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