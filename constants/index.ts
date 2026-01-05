const serverAPI = process.env.NEXT_PUBLIC_SERVER_API!;

const API_BASE_URL = `${serverAPI}/api/v1`;

export const ROUTES = {
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
};
