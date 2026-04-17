"""
PRISM-CODE — FastAPI Application Entry Point
Main server that coordinates all analysis engines and serves the API.
"""
import os
import sys
import shutil
import tempfile
import uuid
import re
from pathlib import Path
from typing import Dict, Any, Optional, List
import zipfile
from contextlib import asynccontextmanager

# Prevent Errno 5: Input/output error when running as a daemon
try:
    sys.stdout.fileno()
except OSError:
    sys.stdout = open('/tmp/prism_stdout.log', 'a')
try:
    sys.stderr.fileno()
except OSError:
    sys.stderr = open('/tmp/prism_stderr.log', 'a')

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import git

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import config
from core.parser.python_parser import PythonParser
from core.parser.js_parser import JavaScriptParser
from core.parser.base_parser import FileAnalysis
from core.graph.graph_builder import GraphBuilder
from core.graph.graph_analyzer import GraphAnalyzer
from core.graph.impact_analyzer import ImpactAnalyzer
from core.flow.flow_tracer import FlowTracer
from core.search.semantic_search import SemanticSearch
from core.ai.explainer import CodeExplainer
from core.git.git_analyzer import GitAnalyzer
from core.smells.detector import SmellDetector
from core.ai.llm_provider import get_llm


# ─── Global State ─────────────────────────────────────────────────────
class AppState:
    """Holds the current analysis state."""
    def __init__(self):
        self.graph_builder: Optional[GraphBuilder] = None
        self.graph_analyzer: Optional[GraphAnalyzer] = None
        self.impact_analyzer: Optional[ImpactAnalyzer] = None
        self.flow_tracer: Optional[FlowTracer] = None
        self.search_engine: Optional[SemanticSearch] = None
        self.explainer: Optional[CodeExplainer] = None
        self.git_analyzer: Optional[GitAnalyzer] = None
        self.smell_detector: Optional[SmellDetector] = None
        self.file_analyses: Dict[str, FileAnalysis] = {}
        self.current_repo_path: Optional[str] = None
        self.is_analyzed: bool = False

state = AppState()


# ─── App Lifecycle ────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Auto-analyze sample repo on startup."""
    print("🔷 PRISM-CODE starting up...")
    # Initialize LLM
    llm = get_llm()
    # Auto-analyze sample repo
    sample_path = config.SAMPLE_REPO_PATH
    if os.path.isdir(sample_path):
        print(f"📂 Auto-analyzing sample repo: {sample_path}")
        _run_analysis(sample_path)
        print("✅ Sample repo analyzed successfully")
    yield
    print("🔷 PRISM-CODE shutting down...")


app = FastAPI(
    title="PRISM-CODE",
    description="AI-powered codebase analysis and exploration system",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Core Analysis Engine ────────────────────────────────────────────
def _run_analysis(repo_path: str) -> Dict[str, Any]:
    """Parse and analyze a codebase."""
    if not os.path.isdir(repo_path):
        raise ValueError(f"Directory not found: {repo_path}")

    # Initialize parsers
    py_parser = PythonParser(repo_path)
    js_parser = JavaScriptParser(repo_path)
    parsers = [py_parser, js_parser]

    # Walk directory and parse files
    analyses = []
    for root, dirs, files in os.walk(repo_path):
        # Skip ignored directories
        dirs[:] = [d for d in dirs if d not in config.IGNORE_DIRS]

        for fname in files:
            file_path = os.path.join(root, fname)
            ext = os.path.splitext(fname)[1]

            if ext not in config.SUPPORTED_EXTENSIONS:
                continue

            for parser in parsers:
                if ext in parser.get_supported_extensions():
                    analysis = parser.parse_file(file_path)
                    if analysis:
                        analyses.append(analysis)
                    break

    # Build graph
    state.graph_builder = GraphBuilder()
    graph = state.graph_builder.build(analyses)

    # Store file analyses
    state.file_analyses = {a.relative_path: a for a in analyses}

    # Initialize all engines
    state.graph_analyzer = GraphAnalyzer(graph)
    state.impact_analyzer = ImpactAnalyzer(graph)
    state.flow_tracer = FlowTracer(graph, state.file_analyses)
    state.search_engine = SemanticSearch()
    state.search_engine.index_codebase(state.file_analyses)
    state.explainer = CodeExplainer(graph, state.file_analyses)
    state.git_analyzer = GitAnalyzer(repo_path)
    state.smell_detector = SmellDetector(graph, state.file_analyses)
    state.current_repo_path = repo_path
    state.is_analyzed = True

    return state.graph_analyzer.get_graph_stats()


def _require_analysis():
    """Ensure codebase has been analyzed."""
    if not state.is_analyzed:
        raise HTTPException(status_code=400, detail="No codebase analyzed. POST /api/analyze first.")


# ─── Pydantic Models ─────────────────────────────────────────────────
class AnalyzeRequest(BaseModel):
    path: str = Field(..., description="Absolute path or Git URL to codebase directory")

class ImpactRequest(BaseModel):
    node_id: str
    max_depth: int = 10

class FlowRequest(BaseModel):
    function_name: str
    max_depth: int = 15

class SearchRequest(BaseModel):
    query: str
    top_k: int = 10

class ExplainRequest(BaseModel):
    node_id: str
    level: str = "intermediate"


# ─── API Routes ───────────────────────────────────────────────────────

@app.get("/api/health")
async def health_check():
    llm = get_llm()
    return {"status": "ok", "analyzed": state.is_analyzed, "llm_available": llm.available}


@app.post("/api/analyze")
async def analyze_codebase(req: AnalyzeRequest):
    """Parse and analyze a codebase directory or remote Git URL."""
    try:
        target_path = req.path.strip()
        is_remote = target_path.startswith(("http://", "https://", "git@"))
        
        if is_remote:
            # Create a dedicated directory for cloned repos if it doesn't exist
            repos_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "repos")
            os.makedirs(repos_dir, exist_ok=True)
            
            # Create a stable directory name based on the repo name
            repo_name = target_path.split("/")[-1].replace(".git", "")
            if not repo_name:
                repo_name = f"repo_{uuid.uuid4().hex[:8]}"
                
            local_path = os.path.join(repos_dir, repo_name)
            
            # If it already exists, we could pull or just delete and re-clone. 
            # For simplicity, let's delete and re-clone to ensure clean state.
            if os.path.exists(local_path):
                print(f"🗑️ Removing existing clone at {local_path}")
                shutil.rmtree(local_path, ignore_errors=True)
                
            # Inject github token if available for private repos
            clone_url = target_path
            gh_token = os.getenv("GITHUB_TOKEN")
            if gh_token and "github.com" in clone_url and clone_url.startswith("https://"):
                # e.g., https://github.com/user/repo -> https://token@github.com/user/repo
                clone_url = clone_url.replace("https://github.com", f"https://{gh_token}@github.com")

            print(f"📥 Cloning remote repo {target_path} into {local_path}...")
            git.Repo.clone_from(clone_url, local_path, depth=1)
            target_path = local_path
            
        stats = _run_analysis(target_path)
        return {
            "status": "success",
            "message": f"Analyzed codebase at {req.path}",
            "stats": stats,
            "local_path": target_path
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except git.exc.GitCommandError as e:
        raise HTTPException(status_code=400, detail=f"Failed to clone repository: {e}")
    except Exception as e:
        import traceback
        with open("/tmp/error.log", "w") as f:
            traceback.print_exc(file=f)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/api/upload_zip")
async def upload_zip_codebase(file: UploadFile = File(...)):
    """Upload a ZIP file, extract it, and analyze the codebase."""
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip files are supported.")
        
    try:
        # Create a dedicated directory for uploaded repos if it doesn't exist
        repos_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "repos")
        os.makedirs(repos_dir, exist_ok=True)
        
        # Create a stable directory name based on the zip name
        repo_name = file.filename.replace(".zip", "")
        if not repo_name:
            repo_name = f"upload_{uuid.uuid4().hex[:8]}"
            
        local_path = os.path.join(repos_dir, repo_name)
        
        # If it already exists, clear it
        if os.path.exists(local_path):
            print(f"🗑️ Removing existing directory at {local_path}")
            shutil.rmtree(local_path, ignore_errors=True)
            
        os.makedirs(local_path, exist_ok=True)
        
        # Save zip to a temp file
        temp_zip_path = os.path.join(repos_dir, f"temp_{uuid.uuid4().hex}.zip")
        with open(temp_zip_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        print(f"📦 Extracting zip to {local_path}...")
        try:
            with zipfile.ZipFile(temp_zip_path, "r") as zip_ref:
                zip_ref.extractall(local_path)
        except zipfile.BadZipFile:
            os.remove(temp_zip_path)
            raise HTTPException(status_code=400, detail="Invalid or corrupt ZIP file.")
            
        # Clean up the temp zip file
        os.remove(temp_zip_path)
        
        # It's common for zips to have a single root folder (like from GitHub).
        # We can dynamically detect this to avoid deep nested paths, but for simplicity
        # we'll just run analysis on the extracted root.
        
        stats = _run_analysis(local_path)
        return {
            "status": "success",
            "message": f"Analyzed uploaded codebase {file.filename}",
            "stats": stats,
            "local_path": local_path
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        with open("/tmp/error.log", "w") as f:
            traceback.print_exc(file=f)
        raise HTTPException(status_code=500, detail=f"Upload & Analysis failed: {str(e)}")


@app.get("/api/graph")
async def get_graph():
    """Get the full dependency graph for visualization."""
    _require_analysis()
    return state.graph_builder.get_graph_data()


@app.get("/api/graph/stats")
async def get_graph_stats():
    """Get graph statistics."""
    _require_analysis()
    return state.graph_analyzer.get_graph_stats()


@app.get("/api/graph/node/{node_id:path}")
async def get_node_details(node_id: str):
    """Get details for a specific node."""
    _require_analysis()
    graph = state.graph_builder.graph
    if node_id not in graph:
        raise HTTPException(status_code=404, detail=f"Node '{node_id}' not found")

    data = dict(graph.nodes[node_id])
    data["id"] = node_id

    # Get edges
    incoming = [{"source": s, "type": d.get("type", "")}
                for s, _, d in graph.in_edges(node_id, data=True)]
    outgoing = [{"target": t, "type": d.get("type", "")}
                for _, t, d in graph.out_edges(node_id, data=True)]

    data["incoming_edges"] = incoming
    data["outgoing_edges"] = outgoing

    return data


@app.post("/api/impact")
async def analyze_impact(req: ImpactRequest):
    """Simulate the impact of changing a node."""
    _require_analysis()
    result = state.impact_analyzer.analyze_impact(req.node_id, req.max_depth)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    # Add AI-powered impact summary
    llm = get_llm()
    all_affected = result.get("direct", []) + result.get("indirect", []) + result.get("potential", [])
    ai_summary = llm.explain_impact(
        result["source"]["label"],
        all_affected,
        result["summary"]["direct"],
        result["summary"]["total_affected"],
    )
    if ai_summary:
        result["ai_summary"] = ai_summary

    return result


@app.post("/api/flow")
async def trace_flow(req: FlowRequest):
    """Trace the execution flow of a function."""
    _require_analysis()
    result = state.flow_tracer.trace_function(req.function_name, req.max_depth)
    if "error" in result and not result.get("steps"):
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@app.post("/api/search")
async def search_code(req: SearchRequest):
    """Search code using natural language queries."""
    _require_analysis()
    results = state.search_engine.search(req.query, req.top_k)

    # Add AI-powered search summary
    llm = get_llm()
    ai_summary = llm.smart_search_explain(req.query, results)
    return {"query": req.query, "results": results, "ai_summary": ai_summary}


@app.post("/api/explain")
async def explain_code(req: ExplainRequest):
    """Get a multi-level explanation of a code element."""
    _require_analysis()
    result = state.explainer.explain(req.node_id, req.level)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    # Try AI-powered explanation
    llm = get_llm()
    node_id = req.node_id
    if node_id not in state.graph_builder.graph:
        # Try name-based lookup
        for nid, nd in state.graph_builder.graph.nodes(data=True):
            if nd.get("name", "").lower() == node_id.lower() or nid.lower() == node_id.lower():
                node_id = nid
                break

    if node_id in state.graph_builder.graph:
        node_data = state.graph_builder.graph.nodes[node_id]
        file_path = node_data.get("file", node_id)
        analysis = state.file_analyses.get(file_path)

        # Get code snippet
        code = ""
        if analysis and analysis.raw_source:
            lines = analysis.raw_source.splitlines()
            start = max(0, node_data.get("line_start", 1) - 1)
            end = min(len(lines), node_data.get("line_end", start + 30))
            code = "\n".join(lines[start:end])

        # Get dependencies
        deps = [state.graph_builder.graph.nodes[t].get("label", t)
                for _, t, d in state.graph_builder.graph.out_edges(node_id, data=True)
                if d.get("type") in ("imports", "calls")]
        dependents = [state.graph_builder.graph.nodes[s].get("label", s)
                      for s, _, d in state.graph_builder.graph.in_edges(node_id, data=True)
                      if d.get("type") in ("imports", "calls")]

        ai_explanation = llm.explain_code(
            code=code or "(source not available)",
            name=node_data.get("name", node_data.get("label", node_id)),
            code_type=node_data.get("type", "unknown"),
            level=req.level,
            dependencies=deps[:10],
            dependents=dependents[:10],
            docstring=node_data.get("docstring", ""),
            complexity=node_data.get("complexity", 1),
        )
        if ai_explanation:
            result["ai_explanation"] = ai_explanation

    return result


@app.get("/api/onboarding")
async def get_onboarding():
    """Generate an onboarding guide for new developers."""
    _require_analysis()
    graph = state.graph_builder.graph

    # Find entry points (files with no incoming imports)
    file_nodes = [(n, d) for n, d in graph.nodes(data=True) if d.get("type") == "file"]

    entry_points = []
    core_modules = []
    utility_modules = []

    for node_id, data in file_nodes:
        in_imports = sum(1 for _, _, d in graph.in_edges(node_id, data=True)
                        if d.get("type") == "imports")
        out_imports = sum(1 for _, _, d in graph.out_edges(node_id, data=True)
                         if d.get("type") == "imports")

        info = {
            "id": node_id,
            "label": data.get("label", node_id),
            "loc": data.get("loc", 0),
            "docstring": data.get("docstring", ""),
            "dependents": in_imports,
            "dependencies": out_imports,
        }

        if "app." in node_id or "main." in node_id or "index." in node_id:
            entry_points.append(info)
        elif in_imports >= 2:
            core_modules.append(info)
        else:
            utility_modules.append(info)

    # Sort core modules by importance (most depended upon)
    core_modules.sort(key=lambda x: x["dependents"], reverse=True)

    # Build recommended exploration order
    exploration_order = []
    step = 1

    if entry_points:
        for ep in entry_points:
            exploration_order.append({
                "step": step,
                "phase": "Entry Point",
                "node_id": ep["id"],
                "label": ep["label"],
                "reason": "Start here — this is where the application begins",
                "docstring": ep["docstring"],
            })
            step += 1

    for mod in core_modules[:5]:
        exploration_order.append({
            "step": step,
            "phase": "Core Module",
            "node_id": mod["id"],
            "label": mod["label"],
            "reason": f"Core module — used by {mod['dependents']} other files",
            "docstring": mod["docstring"],
        })
        step += 1

    for mod in utility_modules[:3]:
        exploration_order.append({
            "step": step,
            "phase": "Utility",
            "node_id": mod["id"],
            "label": mod["label"],
            "reason": "Utility module — provides shared functionality",
            "docstring": mod["docstring"],
        })
        step += 1

    return {
        "entry_points": entry_points,
        "core_modules": core_modules,
        "utility_modules": utility_modules,
        "exploration_order": exploration_order,
        "total_files": len(file_nodes),
    }


@app.get("/api/git/analysis")
async def git_analysis():
    """Analyze git history for insights."""
    _require_analysis()
    return state.git_analyzer.analyze()


@app.get("/api/smells")
async def detect_smells():
    """Detect code smells and risks."""
    _require_analysis()
    return state.smell_detector.detect_all()


@app.get("/api/files")
async def list_files():
    """List all analyzed files."""
    _require_analysis()
    files = []
    for rel_path, analysis in state.file_analyses.items():
        files.append({
            "path": rel_path,
            "language": analysis.language,
            "loc": analysis.lines_of_code,
            "functions": len(analysis.functions),
            "classes": len(analysis.classes),
            "imports": len(analysis.imports),
        })
    return {"files": files}


@app.get("/api/nodes")
async def list_nodes():
    """List all nodes for selection UI."""
    _require_analysis()
    nodes = []
    for node_id, data in state.graph_builder.graph.nodes(data=True):
        nodes.append({
            "id": node_id,
            "type": data.get("type", "unknown"),
            "label": data.get("label", node_id),
            "file": data.get("file", node_id if data.get("type") == "file" else ""),
        })
    return {"nodes": nodes}


# ─── Run Server ───────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=config.HOST, port=config.PORT)
