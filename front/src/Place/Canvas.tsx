
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

        onMouseDown={canvasMouseDown}
        onMouseMove={canvasMouseMove}
        onMouseUp={canvasMouseUp}
        onWheel={canvasZoomed}
        onMouseLeave={() => {
          setIsDragging(0);
        }}
        onDoubleClick={(e: React.MouseEvent<HTMLCanvasElement>) => {
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