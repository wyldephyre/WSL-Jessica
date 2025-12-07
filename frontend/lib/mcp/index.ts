/**
 * MCP Module Exports
 * Public API for Jessica's MCP implementation
 * 
 * NOTE: MCP module is not yet fully implemented.
 * Server, client, and tool files are missing.
 * Exports are commented out until implementation is complete.
 */

// TODO: Implement MCP server and client
// export { JessicaMCPServer, getMCPServer } from './server';
// export { MCPClient, createMCPClient } from './client';

export type { MCPTool, ToolMethod, ToolResult, ToolContext } from './types';

// TODO: Implement MCP tools
// Re-export tools for direct access if needed (when implemented)
// export { CalendarTool } from './tools/calendar';
// export { MemoryTool } from './tools/memory';
// export { TasksTool } from './tools/tasks';
// export { AITool } from './tools/ai';

// Temporary stubs to prevent build errors
export function getMCPServer(): any {
  throw new Error('MCP server not yet implemented');
}

export function createMCPClient(): any {
  throw new Error('MCP client not yet implemented');
}

