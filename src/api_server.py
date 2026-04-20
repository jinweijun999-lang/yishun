# YiShun API Server
# 玄学出海App后端API

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
sys.path.append('/home/jinweijun999/app/src')
from bazi import calc_bazi
from fortune import generate_fortune_report

app = FastAPI(title="YiShun API", version="1.0.0")

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BaziRequest(BaseModel):
    year: int
    month: int
    day: int
    hour: int
    minute: int = 0
    longitude: float = 116.4

@app.get("/")
def root():
    return {"message": "YiShun API v1.0.0", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/api/v1/bazi")
def get_bazi(req: BaziRequest):
    """八字排盘API"""
    try:
        result = calc_bazi(
            year=req.year,
            month=req.month,
            day=req.day,
            hour=req.hour,
            minute=req.minute,
            longitude=req.longitude
        )
        return {"success": True, "data": result}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/v1/fortune")
def get_fortune(req: BaziRequest):
    """运势分析API"""
    try:
        bazi = calc_bazi(
            year=req.year,
            month=req.month,
            day=req.day,
            hour=req.hour,
            minute=req.minute,
            longitude=req.longitude
        )
        report = generate_fortune_report(bazi)
        return {"success": True, "data": {"report": report, "bazi": bazi}}
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)