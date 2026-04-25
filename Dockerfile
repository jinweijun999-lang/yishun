# YiShun API Server - Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 复制源代码
COPY src/ ./src/

# 安装Python依赖（包括 Gemini AI）
RUN pip install --no-cache-dir \
    fastapi==0.109.0 \
    uvicorn==0.27.0 \
    pydantic==2.5.0 \
    python-multipart==0.0.6 \
    google-genai>=1.0.0

# 暴露端口
EXPOSE 8000

# 设置Python路径
ENV PYTHONPATH=/app/src

# 启动命令
CMD ["uvicorn", "src.api_server:app", "--host", "0.0.0.0", "--port", "8000"]