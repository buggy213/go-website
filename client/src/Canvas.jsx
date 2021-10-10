import useCanvas from './useCanvas'



const Canvas = props => {  
  
  const { draw, clickHandler, hoverHandler, exitHandler, ...rest } = props
  const canvasRef = useCanvas(draw)
  
  return <canvas style={{height: "500px", width: "500px"}} ref={canvasRef} onMouseMove={hoverHandler} onMouseDown={clickHandler} onMouseLeave={exitHandler} {...rest}/>
}

export default Canvas