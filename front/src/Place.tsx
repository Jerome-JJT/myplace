import classNames from 'classnames';
import { useRef, useState, useEffect, useCallback } from 'react'

export function Place() {
    const pl = useRef<HTMLCanvasElement | null>(null);

    const ratio = 16;

    const colors: Map<string, string> = new Map([
        ['red', '231, 76, 60'],
        ['blue', '52, 152, 219'],
        ['yellow', '241, 196, 15'],
        
        ['green', '46, 204, 113'],
        ['orange', '230, 126, 34'],
        ['purple', '155, 89, 182'],
        ['white', '236, 240, 241'],
        ['black', '44, 62, 80'],

    ]);

    const [activePixel, setActivePixel] = useState<[number, number]>([-1, -1]);
    const [activeColor, setActiveColor] = useState('');
    const [overlayStyle, setOverlayStyle] = useState({top: '0px', left: '0px'})


    useEffect(() => {
        const data = [
            ['blue', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red'],
            ['yellow', 'red', 'red', 'red', 'green', 'red', 'red', 'green', 'red', 'red'],
            ['red', 'blue', 'red', 'red', 'green', 'red', 'red', 'red', 'red', 'red'],
            ['yellow', 'red', 'red', 'red', 'red', 'red', 'blue', 'red', 'blue', 'red'],
            ['red', 'red', 'blue', 'red', 'blue', 'red', 'red', 'red', 'green', 'red'],

            ['red', 'red', 'yellow', 'red', 'red', 'red', 'red', 'red', 'red', 'red'],
            ['red', 'blue', 'red', 'red', 'yellow', 'red', 'red', 'red', 'red', 'blue'],
            ['red', 'red', 'green', 'red', 'yellow', 'red', 'red', 'red', 'red', 'red'],
            ['red', 'red', 'blue', 'red', 'red', 'red', 'yellow', 'red', 'red', 'red'],
            ['red', 'red', 'red', 'red', 'blue', 'yellow', 'red', 'blue', 'green', 'red'],
        ]

        if (pl.current !== null) {
            let ctx = pl.current.getContext('2d');

            if (ctx !== null) {
        
                data.forEach((column, x) => {
                    column.forEach((pixel, y) => {

                        ctx.fillStyle = 'rgb(' + colors.get(pixel) + ')';
                        ctx.fillRect(x, y, 1, 1);
                    })
                })
            }
        }
    });
    
    const canvasClicked = useCallback((e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        const offsetX = (e.target as HTMLCanvasElement).offsetLeft;
        const offsetY = (e.target as HTMLCanvasElement).offsetTop;

        const clickedX = Math.floor((e.pageX - offsetX) / ratio);
        const clickedY = Math.floor((e.pageY - offsetY) / ratio);

        if (clickedX < 10 && clickedY < 10) {
            setActivePixel([clickedX, clickedY]);
            setOverlayStyle({
                top: ((clickedY * ratio) + offsetY) + 'px', 
                left: ((clickedX * ratio) + offsetX) + 'px'
            });
        }
        else {
            setActivePixel([-1, -1]);
        }

    }, [])

    return (
        <>
            <canvas width="50" height="50" ref={pl} onClick={canvasClicked}></canvas>

            { activePixel[0] !== -1 && <div id="overlay" style={overlayStyle}></div> }

            <div className='fixed flex bottom-0 w-full'>
                <div id='menu' className='mx-auto self-center bg-red-500 flex flex-col '>
                    <div className='self-center bg-blue-500 w-40'>
                        text
                    </div>
                    <div className='self-center bg-green-500 p-2 flex flex-row gap-2'>
                        {
                            Array.from(colors.entries()).map((v) => {
                                return (
                                    <div className='text-center'>
                                        <div 
                                            className={classNames('w-14 h-8 rounded border-2 hover:border-white', activeColor === v[0] ? 'border-white' : 'border-black')}
                                            style={{backgroundColor: 'rgb(' + v[1] + ')'}}
                                            onClick={() => {setActiveColor(v[0])}}
                                        >
                                                
                                        </div>
                                        {v[0]}
                                    </div>
                                )
                            })
                        }
                    </div>
                </div>
            </div>
        </>
    )
}

