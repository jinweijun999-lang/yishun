# YiShun API Server
# 玄学出海App后端API

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from bazi import calc_bazi
from fortune import generate_fortune_report

# 尝试导入 Gemini 服务（可选）
gemini_service = None
try:
    from gemini_service import generate_ai_fortune, is_available as is_gemini_available
    gemini_service = {'generate_ai_fortune': generate_ai_fortune, 'is_available': is_gemini_available}
except ImportError:
    pass

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
    name: str = ""

class FortuneRequest(BaseModel):
    bazi: dict
    aspect: str = "综合"

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
        # 添加名称（如果有）
        if req.name:
            result['name'] = req.name
        return {"success": True, "data": result}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/v1/fortune")
def get_fortune(req: FortuneRequest):
    """运势分析API - 优先使用 Gemini AI，如不可用则使用本地算法"""
    try:
        bazi = req.bazi
        aspect = req.aspect
        
        # 优先尝试 Gemini AI
        if gemini_service and gemini_service['is_available']():
            try:
                ai_result = gemini_service['generate_ai_fortune'](bazi, aspect=aspect)
                if ai_result:
                    return {"success": True, "data": ai_result, "source": "gemini"}
            except Exception as e:
                print(f"Gemini error, falling back to local: {e}")
        
        # 回退到本地算法
        text_report = generate_fortune_report(bazi)
        return {"success": True, "data": {"report": text_report, "bazi": bazi}, "source": "local"}
        
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/v1/gemini-status")
def gemini_status():
    """检查 Gemini 是否可用"""
    if gemini_service:
        available = gemini_service['is_available']()
        return {
            "available": available,
            "api_key_configured": bool(os.environ.get('GOOGLE_API_KEY')),
            "source": "google_generativeai"
        }
    return {"available": False, "reason": "gemini_service not imported", "source": None}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)