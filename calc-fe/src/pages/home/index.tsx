import { useEffect, useRef, useState } from "react";
import { SWATCHES } from "@/assets/constants";
import { ColorSwatch, Group } from "@mantine/core";
import {Button} from "@/components/ui/button"
import axios from "axios";

export default function Home() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('rgb(0, 0, 0)');
    const [resetvar, setReset] = useState(false);
    const [result, setResult] = useState<GeneratedResult>();
    const [dictOfVars, setDictOfVars] = useState({});

    interface Response {
        expression: string;
        result: string;
        assign: boolean;
    }

    interface GeneratedResult {
        expression: string;
        answer: string;
    }

    useEffect(() => {
        const canvas = canvasRef.current;

        if(canvas){
            const ctx = canvas.getContext("2d");
            if (ctx){
                canvas.style.background = "white";
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight- canvas.offsetTop;
                ctx.lineCap = "round";
                ctx.lineWidth = 3;
            }
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
            
            const resp = await response.data as Response;
            console.log('sent');
            console.log('Response: ', resp);
        }
    };
      
  return (
    <div>
        <canvas
    ref = {canvasRef}
    id = "canvas"
    className="absolute top-0 left-0 w-full h-full"
    onMouseDown={startDrawing}
    onMouseOut={stopDrawing}
    onMouseUp={stopDrawing}
    onMouseMove={draw}
    />
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
    </div>
  )
}