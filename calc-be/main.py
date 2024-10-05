from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from constants import SERVER_URL, SERVER_PORT, ENV
from apps.calculator.route import router as calculator_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health():
    return {"status": "ok"}

app.include_router(calculator_router, prefix="/calculate", tags=["calculate"])

if __name__ == "__main__":
    uvicorn.run(app, host=SERVER_URL, port=SERVER_PORT)
    #uvicorn.run("main:app", host=SERVER_URL, port=int(SERVER_PORT), reload=(ENV == 'dev'))