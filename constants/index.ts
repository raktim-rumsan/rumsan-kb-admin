const serverAPI = process.env.NEXT_PUBLIC_SERVER_API!;

const API_BASE_URL = `${serverAPI}/api/v1`;

export const ROUTES = {
  // AI Tool - MCP Server Routes
  MCP_SERVERS: `${API_BASE_URL}/mcp-servers`,
  MCP_SERVER_BY_SECTOR: (sectorName: string) =>
    `${API_BASE_URL}/mcp-servers/sector/${sectorName}`,
  MCP_TOOGGLE_SERVER: (serverId: string) =>
    `${API_BASE_URL}/mcp-servers/${serverId}`,
  MCP_CREATE_SERVER: `${API_BASE_URL}/mcp-servers`,
  MCP_UPDATE_SERVER: (serverId: string) =>
    `${API_BASE_URL}/mcp-servers/${serverId}`,
  MCP_DELETE_SERVER: (serverId: string) =>
    `${API_BASE_URL}/mcp-servers/${serverId}`,
  MCP_TOOGGLE_TOOL: (serverId: string, toolId: string) =>
    `${API_BASE_URL}/mcp-servers/${serverId}/tools/${toolId}/toggle`,
  MCP_SYNC_TOOLS: (serverId: string) =>
    `${API_BASE_URL}/mcp-servers/${serverId}/tools/sync`,

  // Document Routes
  UPLOAD_DOCUMENTS: `${API_BASE_URL}/admin/docs/upload`,
  DOCUMENTS: `${API_BASE_URL}/admin/docs`,
  DELETE_DOCUMENT: (documentId: string) =>
    `${API_BASE_URL}/admin/docs/${documentId}`,
  EMBEDDINGS: `${API_BASE_URL}/admin/embeddings`,
  UNEMBEDDINGS: `${API_BASE_URL}/admin/embeddings/unembed`,
};
