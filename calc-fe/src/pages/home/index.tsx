import { useEffect, useRef, useState } from "react";
import { SWATCHES } from "@/assets/constants";
import { ColorSwatch, Group } from "@mantine/core";
import {Button} from "@/components/ui/button";
import Draggable from 'react-draggable';
import axios from "axios";

export default function Home() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('rgb(255, 255, 255)');
    const [result, setResult] = useState<GeneratedResult>();
    const [dictOfVars, setDictOfVars] = useState({});
    const [latex, setLatex] = useState<Array<String>>([]);
    const [latexPos, setLatexPos] = useState({x:10, y:200});

    interface Response {
        expr: string;
        result: string;
        assign: boolean;
    }

    interface GeneratedResult {
        expression: string;
        answer: string;
    }

    useEffect(() => {
        if (latex.length > 0 && window.MathJax){
            setTimeout(() => {
                window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
            }, 0);
        }
    }, [latex]);

    useEffect(() => {
        if(result){
            console.log(result);
            renderLatexToCanvas(result.expression, result.answer);
        }
    }, [result]);

    useEffect(() => {
        const canvas = canvasRef.current;

        if(canvas){
            const ctx = canvas.getContext("2d");
            if (ctx){
                canvas.style.background = "black";
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight- canvas.offsetTop;
                ctx.lineCap = "round";
                ctx.lineWidth = 3;
            }
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML';
        script.async = true;
        document.head.appendChild(script);

        script.onload= () => {
            window.MathJax.Hub.Config({
                tex2jax: {inlineMath: [['$', '$'], ['\\(', '\\)']]}
            });
            console.log('MathJax loaded');
        }

        return () => {
            document.head.removeChild(script);
        }
    }, []);
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (canvas){
            const ctx = canvas.getContext("2d");
            if (ctx){
                ctx.beginPath();
                ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                setIsDrawing(true);
            }
        }
    }

    const stopDrawing = () => {
        setIsDrawing(false);
    }

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isDrawing){
            const canvas = canvasRef.current;
            if (canvas){
                const ctx = canvas.getContext("2d");
                if (ctx){
                    ctx.strokeStyle = color;
                    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                    ctx.stroke();
                }
            }
        }
    }

    const reset = () => {
        const canvas = canvasRef.current;
            if (canvas){
                const ctx = canvas.getContext("2d");
                if (ctx){
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            }
            setLatex([]);
            setResult(undefined);
            setDictOfVars({});
    }

    const download = () => {
        const canvas = canvasRef.current;
            if (canvas){
                const dataURL = canvas.toDataURL("image/png");
                const link = document.createElement("a");
                link.href = dataURL;
                link.download = "canvas_drawing.png"; 
                link.click();
            }
    }

    const uploadCanvasImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            console.log("file found");  
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");
      
          const img = new Image();
          img.onload = () => {
            if (canvas && ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }
          };
          img.src = URL.createObjectURL(file);
          e.target.value = '';
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click(); // Trigger the file input click
    };

    const sendData = async () => {
        const canvas = canvasRef.current;
        if (canvas){
            const response = await axios({
                method: 'post',
                url: `${import.meta.env.VITE_API_URL}/calculate`,
                data: {
                    image: canvas.toDataURL("image/png"),
                    dict_of_vars: dictOfVars,
                }
            })
            
            const resp = await response.data;
            console.log('sent');
            console.log('Response: ', resp);
            resp.data.forEach((data: Response) => {
                if (data.assign){
                    console.log( 'Data: ', data);
                    setDictOfVars({...dictOfVars, [data.expr]: data.result});
                }
            });
            const ctx = canvas.getContext("2d");
            if (ctx){
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
                for (let y = 0; y < canvas.height; y++) {
                    for (let x = 0; x < canvas.width; x++) {
                      if (imageData.data[(y * canvas.width + x) * 4 + 3] > 0) { // Check if pixel is non-transparent
                        if (x < minX) minX = x;  // Update minX if current x is smaller
                        if (x > maxX) maxX = x;  // Update maxX if current x is larger
                        if (y < minY) minY = y;  // Update minY if current y is smaller
                        if (y > maxY) maxY = y;  // Update maxY if current y is larger
                      }
                    }
                  }
                  
                  const centerX = (minX + maxX) / 2;  // Calculate center x-coordinate
                  const centerY = (minY + maxY) / 2;  // Calculate center y-coordinate

                  //another writing point
                  setLatexPos({x: centerX, y: centerY});
                  resp.data.forEach((data: Response) => {
                        setTimeout(() => {
                            setResult({expression: data.expr, answer: data.result});
                        },200);
                  });
            }
            
        }
        
    };

    const renderLatexToCanvas = (expression: string, answer: string) => {
        console.log(expression, answer);
        const newlatex = `\\(LARGE{${expression} = ${answer}}\\)`;
        setLatex([... latex, newlatex]);

        const canvas = canvasRef.current;
        if (canvas){
            const ctx = canvas.getContext("2d");
            if (ctx){
                //keep an eye on this line, might have a cooler implementation if i dont clear it
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                /* ctx.font = "30px Arial";
                ctx.fillStyle = "black";
                ctx.fillText(expression, latexPos.x, latexPos.y);
                ctx.fillText(answer, latexPos.x, latexPos.y + 40);
                setLatexPos({x: latexPos.x, y: latexPos.y + 80}); */
            }
        }
    }
      
  return (
    <>
        <canvas
    ref = {canvasRef}
    id = "canvas"
    className="absolute top-0 left-0 w-full h-full"
    onMouseDown={startDrawing}
    onMouseOut={stopDrawing}
    onMouseUp={stopDrawing}
    onMouseMove={draw}
    />
    {/* {latex && latex.map((_latex, index) => (
        <Draggable 
            key={index}
            defaultPosition={latexPos}
            onStop={(e, data) => setLatexPos({x: data.x, y: data.y})}>
            <div className="absolute text-white"/>
            <div className="latex-content">{_latex}</div>
        </Draggable>
    ))} */}
    {latex && latex.map((_latex, index) => (
    <Draggable
        key={index}
        defaultPosition={latexPos}
        onStop={(e, data) => setLatexPos({ x: data.x, y: data.y })}
    >
        <div className="absolute p-2 text-white rounded shadow-md">
            <div className="latex-content" dangerouslySetInnerHTML={{ __html: latex }} />
        </div>
    </Draggable>
    ))}

    <input
        type="file"
        ref={fileInputRef}
        onChange={uploadCanvasImage}
        style={{ display: "none" }} // Hide the input
      />
    

    <div className="absolute top-4 right-4 flex space-x-4">
    <Group className="z-20">
        {SWATCHES.map((swatch: string) => (
            <ColorSwatch
                key={swatch}
                color={swatch}
                onClick={() => setColor(swatch)}
            />
        ))}
    </Group>
        <button className="p-4 bg-blue-500 text-white rounded" onClick={reset}>
            Reset
        </button>
        <button className="p-4 bg-purple-500 text-white rounded" onClick={download}>
            Download
        </button>
        <button className="p-4 bg-black-500 text-white rounded" onClick={handleUploadClick}>
            Upload
        </button>
        <button className="p-4 bg-green-500 text-white rounded" onClick={sendData}>
            Get Solution
        </button>
    </div>
    </>
  )
}