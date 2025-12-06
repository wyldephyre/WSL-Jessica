/**
 * MCP Module Exports
 * Public API for Jessica's MCP implementation
 */

export { JessicaMCPServer, getMCPServer } from './server';
export { MCPClient, createMCPClient } from './client';
export type { MCPTool, ToolMethod, ToolResult, ToolContext } from './types';

// Re-export tools for direct access if needed
export { CalendarTool } from './tools/calendar';
export { MemoryTool } from './tools/memory';
export { TasksTool } from './tools/tasks';
export { AITool } from './tools/ai';

