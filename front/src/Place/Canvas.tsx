
import { useCanvas } from './CanvasProvider';
import { CANVAS_X, CANVAS_Y, MAX_SCALE, MIN_SCALE } from 'src/Utils/consts';


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


  return (
    <>
      {activePixel.x !== -1 && <div id="overlay" style={overlayStyle}></div>}
      <canvas
        width={`${CANVAS_X}px`}
        height={`${CANVAS_Y}px`}
        ref={pl}

        onMouseDown={(e: React.MouseEvent<HTMLCanvasElement>) => {
          console.log('mousedown');
          canvasMouseDown(e.pageX, e.pageY);
        }}
        onMouseMove={(e: React.MouseEvent<HTMLCanvasElement>) => {
          console.log('mousemove');
          canvasMouseMove(e.pageX, e.pageY);
        }}
        onMouseUp={(e: React.MouseEvent<HTMLCanvasElement>) => {
          console.log('mouseup', e.pageX, e.pageY);
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
          console.log('double');
          if (scale > (MIN_SCALE + MAX_SCALE) / 2) {
            doZoom(e.pageX, e.pageY, MIN_SCALE);
          }
          else {
            doZoom(e.pageX, e.pageY, MAX_SCALE);
          }
        }}

        style={{
          transform: `scale(${scale}) translate(${translate.x}px, ${translate.y}px)`,
        }}
      >
      </canvas>
    </>
  );
};