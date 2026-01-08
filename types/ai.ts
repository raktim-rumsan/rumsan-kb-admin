export type AuthEntry = {
  key: string;
  value: string;
  show?: boolean;
  isEncrypted?: boolean;
};

export type FormValues = {
  name: string;
  url: string;
  sectorName?: string;
  authentication: AuthEntry[];
};

export interface McpServer {
  id: string;
  name: string;
  url: string;
  sectorName?: string;
  isActive?: boolean;
  authentication?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
  mcpTools?: McpTool[];
}

export interface CreateMcpServerPayload {
  name: string;
  url: string;
  sectorName?: string;
  authentication: Record<string, string>;
}

export interface McpTool {
  id: string;
  mcpServerId?: string;
  name: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateMcpServerPayload {
  serverId: string;
  name?: string;
  url?: string;
  sectorName?: string;
  isActive?: boolean;
  authentication?: Record<string, string>;
}
