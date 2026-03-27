# RAG Knowledge QA

基于 LangChain + FastAPI + 阿里云百炼的 RAG 问答系统。

## 依赖

- Python 3.9+
- Node.js 18+
- 阿里云 DashScope API Key

## 启动

**后端：**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # 填入 DASHSCOPE_API_KEY
uvicorn main:app --reload --port 8000
```

**前端：**
```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:5173

## 配置

在 `backend/.env` 中配置：

```env
DASHSCOPE_API_KEY=你的API密钥
LLM_MODEL=qwen-plus
EMB_MODEL=text-embedding-v3
```

## 技术栈

- 后端：FastAPI + LangChain + FAISS + 阿里云百炼
- 前端：React + Tailwind CSS + Vite
