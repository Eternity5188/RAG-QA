"""
RAG Backend — 增强版 RAG 系统
改进：查询扩展、MMR 多样性检索、上下文压缩、更优分块策略、相关性评分
启动: cd backend && python -m uvicorn main:app --reload --port 8000
"""

import os
import uuid
import json
import asyncio
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_community.document_loaders import (
    PyPDFLoader, TextLoader, WebBaseLoader,
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from openai import OpenAI as OpenAIClient
from langchain_core.embeddings import Embeddings
from concurrent.futures import ThreadPoolExecutor

# ==================== 配置 ====================

API_KEY = os.getenv("DASHSCOPE_API_KEY")
if not API_KEY:
    raise ValueError("请设置环境变量 DASHSCOPE_API_KEY")

BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
LLM_MODEL = os.getenv("LLM_MODEL", "qwen-plus")
EMB_MODEL = os.getenv("EMB_MODEL", "text-embedding-v3")

BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "uploads"
INDEX_DIR = BASE_DIR / "faiss_index"
UPLOAD_DIR.mkdir(exist_ok=True)
INDEX_DIR.mkdir(exist_ok=True)

_http_sync = httpx.Client(timeout=120.0)
_http_async = httpx.AsyncClient(timeout=120.0)
_executor = ThreadPoolExecutor(max_workers=4)

# ==================== 自定义 Embedding ====================

class DashScopeEmbeddings(Embeddings):
    def __init__(self, model: str = "text-embedding-v3", batch_size: int = 10):
        self.model = model
        self.batch_size = batch_size
        self.client = OpenAIClient(api_key=API_KEY, base_url=BASE_URL)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        results = []
        for i in range(0, len(texts), self.batch_size):
            batch = texts[i:i + self.batch_size]
            results.extend(self._embed_batch(batch))
        return results

    def embed_query(self, text: str) -> List[float]:
        response = self.client.embeddings.create(model=self.model, input=text)
        return response.data[0].embedding

    def _embed_batch(self, texts: List[str]) -> List[List[float]]:
        response = self.client.embeddings.create(model=self.model, input=texts)
        return [item.embedding for item in response.data]

embeddings = DashScopeEmbeddings(model=EMB_MODEL)
llm = ChatOpenAI(
    model=LLM_MODEL,
    base_url=BASE_URL,
    api_key=API_KEY,
    temperature=0.2,
    streaming=True,
    http_client=_http_sync,
)

# ==================== 查询改写 ====================

def expand_query(question: str, history_context: str = "") -> List[str]:
    """
    查询扩展：生成多个检索视角，提升召回率。
    返回原始查询 + 2 个扩展查询。
    """
    try:
        client = OpenAIClient(api_key=API_KEY, base_url=BASE_URL)
        history_hint = f"\n对话历史摘要：{history_context}" if history_context else ""
        prompt = f"""你是一个搜索查询优化专家。请基于用户问题，生成2个语义相关但角度不同的检索查询，用于从文档库中召回更多相关内容。

用户问题：{question}{history_hint}

要求：
- 每行一个查询
- 查询要简洁（15字以内）
- 覆盖不同角度（如：定义、方法、例子、比较等）
- 只输出查询本身，不要编号或解释

输出2个查询："""

        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=100,
        )
        expanded = response.choices[0].message.content.strip().split("\n")
        expanded = [q.strip() for q in expanded if q.strip()][:2]
        return [question] + expanded
    except Exception:
        return [question]


def deduplicate_docs(docs: List[Document], threshold: float = 0.85) -> List[Document]:
    """
    基于内容相似度去重，避免重复片段进入上下文。
    简单实现：按字符 Jaccard 相似度过滤。
    """
    def jaccard(a: str, b: str) -> float:
        sa = set(a.split())
        sb = set(b.split())
        if not sa or not sb:
            return 0.0
        return len(sa & sb) / len(sa | sb)

    unique = []
    for doc in docs:
        is_dup = any(jaccard(doc.page_content, u.page_content) > threshold for u in unique)
        if not is_dup:
            unique.append(doc)
    return unique


def score_relevance(query: str, docs: List[Document]) -> List[Tuple[Document, float]]:
    """
    关键词匹配打分，作为语义检索的补充信号。
    返回 (doc, score) 列表，按得分降序。
    """
    keywords = set(query.lower().split())
    scored = []
    for doc in docs:
        content_lower = doc.page_content.lower()
        hit = sum(1 for kw in keywords if kw in content_lower)
        score = hit / max(len(keywords), 1)
        scored.append((doc, score))
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored


# ==================== 知识库管理器 ====================

class KnowledgeBase:
    def __init__(self):
        self.vectorstores: Dict[str, FAISS] = {}
        self.metadata: Dict[str, Dict] = {}
        self._load_all()

    def _load_all(self):
        for kb_dir in INDEX_DIR.iterdir():
            if kb_dir.is_dir():
                kb_id = kb_dir.name
                try:
                    vs = FAISS.load_local(
                        str(kb_dir), embeddings,
                        allow_dangerous_deserialization=True
                    )
                    self.vectorstores[kb_id] = vs
                    meta_file = kb_dir / "meta.json"
                    if meta_file.exists():
                        with open(meta_file) as f:
                            self.metadata[kb_id] = json.load(f)
                except Exception as e:
                    print(f"加载知识库 {kb_id} 失败: {e}")

    def create(self, kb_id: str, name: str, description: str = "") -> bool:
        if kb_id in self.vectorstores:
            return False
        self.vectorstores[kb_id] = None
        self.metadata[kb_id] = {
            "name": name,
            "description": description,
            "created_at": datetime.now().isoformat(),
            "doc_count": 0,
            "sources": []
        }
        self._save_meta(kb_id)
        return True

    def delete(self, kb_id: str) -> bool:
        if kb_id not in self.vectorstores:
            return False
        del self.vectorstores[kb_id]
        del self.metadata[kb_id]
        kb_dir = INDEX_DIR / kb_id
        if kb_dir.exists():
            import shutil
            shutil.rmtree(kb_dir)
        return True

    def rename(self, kb_id: str, new_name: str, new_description: str = None) -> bool:
        if kb_id not in self.vectorstores:
            return False
        self.metadata[kb_id]["name"] = new_name
        if new_description is not None:
            self.metadata[kb_id]["description"] = new_description
        self._save_meta(kb_id)
        return True

    def add_documents(self, kb_id: str, docs: List[Document], splitter_config: Dict = None):
        if kb_id not in self.vectorstores:
            raise ValueError(f"知识库 {kb_id} 不存在")

        # ★ 增大 chunk_size，保留更完整的语义单元
        if splitter_config is None:
            splitter_config = {"chunk_size": 800, "chunk_overlap": 200}

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=splitter_config.get("chunk_size", 800),
            chunk_overlap=splitter_config.get("chunk_overlap", 200),
            length_function=len,
            separators=["\n\n\n", "\n\n", "\n", "。", "！", "？", ". ", "，", ""],
        )
        chunks = splitter.split_documents(docs)

        if self.vectorstores[kb_id] is None:
            self.vectorstores[kb_id] = FAISS.from_documents(chunks, embeddings)
        else:
            self.vectorstores[kb_id].add_documents(chunks)

        self._save(kb_id)
        self._update_meta(kb_id, chunks)

    def search_with_expansion(
        self,
        kb_id: str,
        query: str,
        history_context: str = "",
        k: int = 6,
    ) -> Tuple[List[Document], List[str]]:
        """
        多路召回 + 去重 + 相关性重排序。
        返回 (去重后的文档列表, 扩展查询列表)
        """
        if kb_id not in self.vectorstores or self.vectorstores[kb_id] is None:
            return [], [query]

        vs = self.vectorstores[kb_id]

        # 1. 查询扩展
        queries = expand_query(query, history_context)

        # 2. 多路 MMR 检索，fetch 更多候选
        all_docs: List[Document] = []
        for q in queries:
            try:
                docs = vs.max_marginal_relevance_search(q, k=k, fetch_k=k * 4, lambda_mult=0.6)
                all_docs.extend(docs)
            except Exception:
                docs = vs.similarity_search(q, k=k)
                all_docs.extend(docs)

        # 3. 去重
        unique_docs = deduplicate_docs(all_docs, threshold=0.80)

        # 4. 相关性重排：用原始 query 的关键词重新打分，取 top-k
        scored = score_relevance(query, unique_docs)
        final_docs = [doc for doc, _ in scored[:k]]

        return final_docs, queries

    def search(self, kb_id: str, query: str, k: int = 6) -> List[Document]:
        docs, _ = self.search_with_expansion(kb_id, query, k=k)
        return docs

    def _save(self, kb_id: str):
        kb_dir = INDEX_DIR / kb_id
        kb_dir.mkdir(exist_ok=True)
        self.vectorstores[kb_id].save_local(str(kb_dir))

    def _save_meta(self, kb_id: str):
        meta_file = INDEX_DIR / kb_id / "meta.json"
        meta_file.parent.mkdir(exist_ok=True)
        with open(meta_file, 'w') as f:
            json.dump(self.metadata[kb_id], f, ensure_ascii=False, indent=2)

    def _update_meta(self, kb_id: str, chunks: List[Document]):
        meta = self.metadata[kb_id]
        sources = set(meta.get("sources", []))
        for chunk in chunks:
            src = chunk.metadata.get("source", "unknown")
            sources.add(src)
        meta["sources"] = list(sources)
        meta["doc_count"] = len(self.vectorstores[kb_id].docstore._dict)
        meta["updated_at"] = datetime.now().isoformat()
        self._save_meta(kb_id)

    def get_info(self, kb_id: str) -> Optional[Dict]:
        if kb_id not in self.metadata:
            return None
        info = self.metadata[kb_id].copy()
        info["id"] = kb_id
        return info

    def list_all(self) -> List[Dict]:
        return [self.get_info(kb_id) for kb_id in self.vectorstores.keys()]

    def list_documents(self, kb_id: str) -> List[Dict]:
        if kb_id not in self.vectorstores or self.vectorstores[kb_id] is None:
            return []
        docs = []
        for doc_id, doc in self.vectorstores[kb_id].docstore._dict.items():
            docs.append({
                "id": doc_id,
                "content": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                "source": doc.metadata.get("source", "未知"),
                "page": doc.metadata.get("page")
            })
        return docs

    def delete_document(self, kb_id: str, doc_id: str) -> bool:
        if kb_id not in self.vectorstores or self.vectorstores[kb_id] is None:
            return False
        vs = self.vectorstores[kb_id]
        if doc_id not in vs.docstore._dict:
            return False
        all_ids = list(vs.docstore._dict.keys())
        if doc_id in all_ids:
            all_ids.remove(doc_id)
        if all_ids:
            docs_to_keep = [vs.docstore._dict[id] for id in all_ids]
            vs.delete([doc_id])
            self._update_meta(kb_id, docs_to_keep)
        else:
            self.vectorstores[kb_id] = None
            kb_dir = INDEX_DIR / kb_id
            if kb_dir.exists():
                for f in kb_dir.iterdir():
                    if f.name != "meta.json":
                        f.unlink()
            self.metadata[kb_id]["doc_count"] = 0
            self.metadata[kb_id]["sources"] = []
            self._save_meta(kb_id)
        return True


kb_manager = KnowledgeBase()
sessions: Dict[str, Dict] = {}

# ==================== FastAPI 应用 ====================

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await _http_async.aclose()
    _http_sync.close()

app = FastAPI(
    title="RAG API",
    description="增强版 RAG 系统 — 查询扩展 + MMR 检索 + 相关性重排",
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Pydantic 模型 ====================

class CreateKBRequest(BaseModel):
    name: str
    description: str = ""

class RenameKBRequest(BaseModel):
    name: str
    description: Optional[str] = None

class ChatRequest(BaseModel):
    session_id: str
    question: str
    kb_id: str = "default"
    enable_thinking: bool = False

class AddUrlRequest(BaseModel):
    urls: List[str]
    kb_id: str = "default"
    splitter_config: Optional[Dict] = None

class SearchRequest(BaseModel):
    query: str
    kb_id: str = "default"
    top_k: int = 6

# ==================== 工具函数 ====================

def format_docs_with_sources(docs: List[Document]) -> Tuple[str, List[Dict]]:
    """格式化文档并提取来源，附加片段索引"""
    parts = []
    sources = []
    seen_sources = {}

    for i, d in enumerate(docs):
        src = d.metadata.get("source", "未知")
        page = d.metadata.get("page")
        src_label = src.split("/")[-1] if "/" in src else src

        if src not in seen_sources:
            seen_sources[src] = len(sources) + 1
            sources.append({
                "index": seen_sources[src],
                "source": src,
                "label": src_label,
                "page": page,
            })

        idx = seen_sources[src]
        loc = f"[来源{idx}: {src_label}" + (f", 第{page+1}页" if page is not None else "") + "]"
        parts.append(f"{loc}\n{d.page_content}")

    return "\n\n---\n\n".join(parts), sources


# ★ 改进的 System Prompt：更明确的引用要求，防止幻觉
SYSTEM_TEMPLATE = """你是一个专业的文档问答助手。你的任务是基于检索到的文档片段，准确、完整地回答用户问题。

## 回答规则

1. **优先使用文档内容**：充分利用所有检索到的片段，整合信息后给出完整回答
2. **引用来源**：回答中引用具体信息时，用 [来源N] 标注（例如：[来源1]、[来源2]）
3. **诚实回答**：若文档中确实没有相关信息，明确说明"文档中未找到关于XXX的信息"，不要编造
4. **结构化表达**：对于复杂问题，使用标题、列表等结构化方式组织回答
5. **语言**：统一使用中文回答

## 检索到的文档片段

{context}

---

请基于以上文档内容，详细回答用户的问题。回答要具体、有据可查。"""


def build_history_context(history: List) -> str:
    """将最近对话压缩成简短上下文摘要，用于查询扩展"""
    if not history:
        return ""
    recent = history[-4:]  # 最近 2 轮对话
    parts = []
    for msg in recent:
        role = "用户" if isinstance(msg, HumanMessage) else "助手"
        parts.append(f"{role}: {msg.content[:100]}")
    return " | ".join(parts)


# ==================== API 路由 ====================

@app.get("/")
def root():
    return {"status": "ok", "service": "RAG System", "version": "3.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}

# ----- 知识库管理 -----

@app.post("/kb/create")
def create_kb(req: CreateKBRequest):
    if req.name == "默认知识库" and "default" not in kb_manager.vectorstores:
        kb_manager.create("default", req.name, req.description)
        return {"kb_id": "default", "message": "知识库创建成功"}
    kb_id = uuid.uuid4().hex[:8]
    kb_manager.create(kb_id, req.name, req.description)
    return {"kb_id": kb_id, "message": "知识库创建成功"}

@app.get("/kb/list")
def list_kb():
    return {"knowledge_bases": kb_manager.list_all()}

@app.get("/kb/{kb_id}")
def get_kb(kb_id: str):
    info = kb_manager.get_info(kb_id)
    if not info:
        raise HTTPException(status_code=404, detail="知识库不存在")
    return info

@app.delete("/kb/{kb_id}")
def delete_kb(kb_id: str):
    if not kb_manager.delete(kb_id):
        raise HTTPException(status_code=404, detail="知识库不存在")
    return {"message": "知识库已删除"}

@app.put("/kb/{kb_id}")
def rename_kb(kb_id: str, req: RenameKBRequest):
    if not kb_manager.rename(kb_id, req.name, req.description):
        raise HTTPException(status_code=404, detail="知识库不存在")
    return {"message": "知识库已更新"}

# ----- 文档管理 -----

@app.get("/kb/{kb_id}/docs")
def list_docs(kb_id: str):
    if kb_id not in kb_manager.vectorstores:
        raise HTTPException(status_code=404, detail="知识库不存在")
    return {"documents": kb_manager.list_documents(kb_id)}

@app.delete("/kb/{kb_id}/docs/{doc_id}")
def delete_doc(kb_id: str, doc_id: str):
    if kb_id not in kb_manager.vectorstores:
        raise HTTPException(status_code=404, detail="知识库不存在")
    if not kb_manager.delete_document(kb_id, doc_id):
        raise HTTPException(status_code=404, detail="文档不存在")
    return {"message": "文档已删除"}

# ----- 内容添加 -----

@app.post("/upload")
async def upload_file(
    kb_id: str = "default",
    file: UploadFile = File(...),
):
    ext = Path(file.filename).suffix.lower()
    supported = (".pdf", ".txt", ".md", ".html", ".png", ".jpg", ".jpeg")
    if ext not in supported:
        raise HTTPException(status_code=400, detail="只支持 PDF / TXT / MD / HTML / PNG / JPG")

    if kb_id not in kb_manager.vectorstores:
        kb_manager.create(kb_id, kb_id, "自动创建")

    save_path = UPLOAD_DIR / f"{uuid.uuid4()}{ext}"
    save_path.write_bytes(await file.read())

    try:
        if ext in (".png", ".jpg", ".jpeg"):
            import base64
            with open(save_path, "rb") as img_file:
                img_base64 = base64.b64encode(img_file.read()).decode()

            img_prompt = """请仔细识别这张图片中的所有文字内容，包括：
1. 所有可见的文本（无论语言）
2. 表格内容
3. 公式和符号（请用文字描述）
4. 标题、标签、注释等

请完整输出图片中的所有文字，保持原有结构。"""

            response = _http_sync.post(
                f"{BASE_URL}/chat/completions",
                headers={"Authorization": f"Bearer {API_KEY}"},
                json={
                    "model": "qwen-vl-plus",
                    "messages": [{
                        "role": "user",
                        "content": [
                            {"type": "text", "text": img_prompt},
                            {"type": "image_url", "image_url": {"url": f"data:image/{ext[1:]};base64,{img_base64}"}}
                        ]
                    }],
                    "max_tokens": 2000
                }
            )
            result = response.json()
            text_content = result["choices"][0]["message"]["content"] if "choices" in result else str(result)
            docs = [Document(page_content=text_content, metadata={"source": file.filename, "type": "image"})]
        elif ext == ".pdf":
            loader = PyPDFLoader(str(save_path))
            docs = loader.load()
        elif ext == ".html":
            try:
                from langchain_community.document_loaders import UnstructuredHTMLLoader
                loader = UnstructuredHTMLLoader(str(save_path))
                docs = loader.load()
            except Exception:
                loader = TextLoader(str(save_path), encoding="utf-8")
                docs = loader.load()
        else:
            loader = TextLoader(str(save_path), encoding="utf-8")
            docs = loader.load()

        kb_manager.add_documents(kb_id, docs)

        return {
            "message": f"已添加 {len(docs)} 段内容",
            "filename": file.filename,
            "kb_id": kb_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/add-url")
def add_url(req: AddUrlRequest):
    if req.kb_id not in kb_manager.vectorstores:
        kb_manager.create(req.kb_id, req.kb_id, "自动创建")

    all_docs = []
    errors = []

    for url in req.urls:
        try:
            loader = WebBaseLoader(url)
            docs = loader.load()
            for doc in docs:
                doc.metadata["source"] = url
            all_docs.extend(docs)
        except Exception as e:
            errors.append(f"{url}: {str(e)}")

    if all_docs:
        kb_manager.add_documents(req.kb_id, all_docs, req.splitter_config)

    return {
        "message": f"已添加 {len(all_docs)} 段",
        "errors": errors,
        "kb_id": req.kb_id
    }

# ----- 搜索 -----

@app.post("/search")
def search(req: SearchRequest):
    docs, queries = kb_manager.search_with_expansion(req.kb_id, req.query, k=req.top_k)
    _, sources = format_docs_with_sources(docs)
    return {
        "results": [{"content": d.page_content, "metadata": d.metadata} for d in docs],
        "sources": sources,
        "expanded_queries": queries,
    }

# ----- 对话 -----

@app.post("/chat/stream")
def chat_stream(req: ChatRequest):
    if req.kb_id not in kb_manager.vectorstores or kb_manager.vectorstores[req.kb_id] is None:
        raise HTTPException(status_code=400, detail="知识库为空，请先上传文件")

    if req.session_id not in sessions:
        sessions[req.session_id] = {"history": [], "kb_id": req.kb_id}
    sessions[req.session_id]["kb_id"] = req.kb_id

    session = sessions[req.session_id]
    history = session["history"]

    async def generate():
        try:
            # ★ 构建历史上下文摘要，用于查询扩展
            history_context = build_history_context(history)

            # ★ 多路检索 + 查询扩展
            docs, expanded_queries = kb_manager.search_with_expansion(
                req.kb_id,
                req.question,
                history_context=history_context,
                k=6,
            )
            context, sources = format_docs_with_sources(docs)

            # 发送来源 + 扩展查询信息
            yield f"data: {json.dumps({'type': 'sources', 'sources': sources, 'expanded_queries': expanded_queries}, ensure_ascii=False)}\n\n"

            # 构建消息：system 包含上下文，history 用标准格式
            messages = [
                {"role": "system", "content": SYSTEM_TEMPLATE.format(context=context)},
            ]
            # 加入历史（最近 6 条）
            for msg in history[-6:]:
                if isinstance(msg, HumanMessage):
                    messages.append({"role": "user", "content": msg.content})
                elif isinstance(msg, AIMessage):
                    messages.append({"role": "assistant", "content": msg.content})

            messages.append({"role": "user", "content": req.question})

            client = OpenAIClient(api_key=API_KEY, base_url=BASE_URL)
            stream = client.chat.completions.create(
                model=LLM_MODEL,
                messages=messages,
                stream=True,
                temperature=0.2,
                max_tokens=2048,
            )

            full_response = ""
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_response += content
                    yield f"data: {json.dumps({'type': 'content', 'content': content}, ensure_ascii=False)}\n\n"

            # 更新历史
            history.append(HumanMessage(content=req.question))
            history.append(AIMessage(content=full_response))
            if len(history) > 20:
                session["history"] = history[-20:]

            yield f"data: {json.dumps({'type': 'done'}, ensure_ascii=False)}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)}, ensure_ascii=False)}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/chat")
def chat(req: ChatRequest):
    if req.kb_id not in kb_manager.vectorstores or kb_manager.vectorstores[req.kb_id] is None:
        raise HTTPException(status_code=400, detail="知识库为空")

    if req.session_id not in sessions:
        sessions[req.session_id] = {"history": [], "kb_id": req.kb_id}

    session = sessions[req.session_id]
    history = session["history"]

    try:
        history_context = build_history_context(history)
        docs, _ = kb_manager.search_with_expansion(req.kb_id, req.question, history_context, k=6)
        context, _ = format_docs_with_sources(docs)

        messages = [{"role": "system", "content": SYSTEM_TEMPLATE.format(context=context)}]
        for msg in history[-6:]:
            if isinstance(msg, HumanMessage):
                messages.append({"role": "user", "content": msg.content})
            elif isinstance(msg, AIMessage):
                messages.append({"role": "assistant", "content": msg.content})
        messages.append({"role": "user", "content": req.question})

        client = OpenAIClient(api_key=API_KEY, base_url=BASE_URL)
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=messages,
            temperature=0.2,
            max_tokens=2048,
        )
        answer = response.choices[0].message.content

        history.append(HumanMessage(content=req.question))
        history.append(AIMessage(content=answer))
        if len(history) > 20:
            session["history"] = history[-20:]

        return {"answer": answer, "session_id": req.session_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/session/{session_id}")
def clear_session(session_id: str):
    if session_id in sessions:
        sessions[session_id]["history"] = []
    return {"message": "会话已清空"}


@app.delete("/knowledge/{kb_id}")
def clear_knowledge(kb_id: str):
    kb_manager.delete(kb_id)
    return {"message": "知识库已清空"}


@app.on_event("startup")
def startup():
    print("=" * 50)
    print("RAG 系统 v3.0 启动中...")
    print(f"改进：查询扩展 + MMR 多样性检索 + 相关性重排 + 更优分块")
    print(f"LLM: {LLM_MODEL}")
    print(f"Embedding: {EMB_MODEL}")
    print("=" * 50)