#!/usr/bin/env node

import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { discoverTools } from "./lib/tools.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

const SERVER_NAME = "generated-mcp-server";

async function transformTools(tools) {
  return tools
    .map((tool) => {
      const definitionFunction = tool.definition?.function;
      if (!definitionFunction) return;
      return {
        name: definitionFunction.name,
        description: definitionFunction.description,
        inputSchema: definitionFunction.parameters,
      };
    })
    .filter(Boolean);
}

async function setupServerHandlers(server, tools) {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: await transformTools(tools),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const tool = tools.find((t) => t.definition.function.name === toolName);
    if (!tool) {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
    }
    const args = request.params.arguments;
    const requiredParameters =
      tool.definition?.function?.parameters?.required || [];
    for (const requiredParameter of requiredParameters) {
      if (!(requiredParameter in args)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Missing required parameter: ${requiredParameter}`
        );
      }
    }
    try {
      const result = await tool.function(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error("[Error] Failed to fetch data:", error);
      throw new McpError(
        ErrorCode.InternalError,
        `API error: ${error.message}`
      );
    }
  });
}

async function run() {
  const args = process.argv.slice(2);
  const isSSE = args.includes("--sse");
  const tools = await discoverTools();

  if (isSSE) {
    const app = express();
    const transports = {};
    const servers = {};

    // Add middleware
    app.use(cors());
    app.use(express.json());
    
    // Health check endpoint
    app.get("/health", (req, res) => {
      res.json({ status: "ok", message: "MCP Server is running" });
    });

    // Root endpoint
    app.get("/", (req, res) => {
      res.json({ 
        message: "Amadeus MCP Server",
        endpoints: ["/health", "/sse", "/messages", "/api/call-tool", "/api/tools"],
        availableTools: tools.map(t => t.definition.function.name)
      });
    });

    // REST endpoint for direct tool calls (for n8n integration)
    app.post("/api/call-tool", async (req, res) => {
      try {
        const { toolName, arguments: args } = req.body;
        
        if (!toolName) {
          return res.status(400).json({ 
            error: "Missing required field: toolName" 
          });
        }
        
        // Find the requested tool
        const tool = tools.find(t => t.definition.function.name === toolName);
        if (!tool) {
          return res.status(404).json({ 
            error: `Tool '${toolName}' not found`,
            availableTools: tools.map(t => t.definition.function.name)
          });
        }
        
        // Validate required parameters
        const requiredParams = tool.definition?.function?.parameters?.required || [];
        for (const param of requiredParams) {
          if (!(param in args)) {
            return res.status(400).json({
              error: `Missing required parameter: ${param}`,
              requiredParameters: requiredParams
            });
          }
        }
        
        // Execute the tool
        console.log(`Executing tool: ${toolName}`, args);
        const result = await tool.function(args);
        res.json(result);
      } catch (error) {
        console.error("Tool execution error:", error);
        res.status(500).json({ 
          error: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    });

    // List available tools endpoint
    app.get("/api/tools", async (req, res) => {
      const toolList = tools.map(tool => ({
        name: tool.definition.function.name,
        description: tool.definition.function.description,
        parameters: tool.definition.function.parameters
      }));
      res.json({ tools: toolList });
    });

    // SSE endpoint for MCP protocol
    app.get("/sse", async (_req, res) => {
      // Create a new Server instance for each session
      const server = new Server(
        {
          name: SERVER_NAME,
          version: "0.1.0",
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );
      server.onerror = (error) => console.error("[Error]", error);
      await setupServerHandlers(server, tools);

      const transport = new SSEServerTransport("/messages", res);
      transports[transport.sessionId] = transport;
      servers[transport.sessionId] = server;

      res.on("close", async () => {
        delete transports[transport.sessionId];
        await server.close();
        delete servers[transport.sessionId];
      });

      await server.connect(transport);
    });

    // Messages endpoint for MCP protocol
    app.post("/messages", async (req, res) => {
      const sessionId = req.query.sessionId;
      const transport = transports[sessionId];
      const server = servers[sessionId];

      if (transport && server) {
        await transport.handlePostMessage(req, res);
      } else {
        res.status(400).send("No transport/server found for sessionId");
      }
    });

    const port = process.env.PORT || 3001;
    app.listen(port, '0.0.0.0', () => {
      console.log(`[SSE Server] running on port ${port}`);
      console.log(`REST API available at http://0.0.0.0:${port}/api/call-tool`);
    });
  } else {
    // stdio mode: single server instance
    const server = new Server(
      {
        name: SERVER_NAME,
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    server.onerror = (error) => console.error("[Error]", error);
    await setupServerHandlers(server, tools);

    process.on("SIGINT", async () => {
      await server.close();
      process.exit(0);
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);
  }
}

run().catch(console.error);