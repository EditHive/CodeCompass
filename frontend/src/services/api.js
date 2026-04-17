import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export const analyzeCodebase = (path) => api.post('/analyze', { path });
export const getGraph = () => api.get('/graph');
export const getGraphStats = () => api.get('/graph/stats');
export const getNodeDetails = (nodeId) => api.get(`/graph/node/${encodeURIComponent(nodeId)}`);
export const analyzeImpact = (nodeId, maxDepth = 10) => api.post('/impact', { node_id: nodeId, max_depth: maxDepth });
export const traceFlow = (functionName, maxDepth = 15) => api.post('/flow', { function_name: functionName, max_depth: maxDepth });
export const searchCode = (query, topK = 10) => api.post('/search', { query, top_k: topK });
export const explainCode = (nodeId, level = 'intermediate') => api.post('/explain', { node_id: nodeId, level });
export const getOnboarding = () => api.get('/onboarding');
export const getGitAnalysis = () => api.get('/git/analysis');
export const getSmells = () => api.get('/smells');
export const getFiles = () => api.get('/files');
export const getNodes = () => api.get('/nodes');
export const healthCheck = () => api.get('/health');

export default api;
