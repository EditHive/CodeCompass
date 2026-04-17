"""
Pydantic Schemas for API request/response validation.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class AnalyzeRequest(BaseModel):
    path: str = Field(..., description="Path to codebase directory")


class AnalyzeResponse(BaseModel):
    status: str
    message: str
    stats: Dict[str, Any] = {}


class GraphResponse(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]


class ImpactRequest(BaseModel):
    node_id: str = Field(..., description="ID of the node to analyze impact for")
    max_depth: int = Field(10, description="Maximum traversal depth")


class FlowRequest(BaseModel):
    function_name: str = Field(..., description="Function name to trace")
    max_depth: int = Field(15, description="Maximum trace depth")


class SearchRequest(BaseModel):
    query: str = Field(..., description="Natural language search query")
    top_k: int = Field(10, description="Number of results to return")


class ExplainRequest(BaseModel):
    node_id: str = Field(..., description="Node ID or name to explain")
    level: str = Field("intermediate", description="beginner, intermediate, or expert")


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
