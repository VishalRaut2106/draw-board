import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { BridgeServer } from './bridge/bridge-server';
import { CanvasBridge } from './bridge/canvas-bridge';
import { createMcpServer } from './server';

async function main() {
  const args = process.argv.slice(2);
  const isHttp = args.includes('--http') || args.includes('--sse');
  const bridgePortArg = args.find((a, i) => args[i - 1] === '--bridge-port');
  const httpPortArg = args.find((a, i) => args[i - 1] === '--http-port');

  const bridgePort = bridgePortArg ? parseInt(bridgePortArg, 10) : (process.env.BRIDGE_PORT ? parseInt(process.env.BRIDGE_PORT, 10) : 4444);
  const httpPort = httpPortArg ? parseInt(httpPortArg, 10) : (process.env.HTTP_PORT ? parseInt(process.env.HTTP_PORT, 10) : 4445);

  // 1. Initialize and start the WebSocket Bridge Server for browser communication
  const bridgeServer = new BridgeServer({ port: bridgePort });
  try {
    await bridgeServer.start();
    if (isHttp) {
      console.log(`[Slate MCP] WebSocket Bridge listening on ws://127.0.0.1:${bridgePort}`);
    } else {
      console.error(`[Slate MCP] WebSocket Bridge listening on ws://127.0.0.1:${bridgePort}`);
    }
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error.code === 'EADDRINUSE') {
      const msg = `[Slate MCP] Bridge port ${bridgePort} is already in use; assuming bridge is already running.`;
      if (isHttp) console.log(msg); else console.error(msg);
    } else {
      const msg = `[Slate MCP] Warning starting bridge server: ${error.message}`;
      if (isHttp) console.log(msg); else console.error(msg);
    }
  }

  // 2. Initialize CanvasBridge abstraction
  const canvasBridge = new CanvasBridge(bridgeServer);

  if (isHttp) {
    // Multi-client SSE and Streamable HTTP support
    const sseTransports = new Map<string, SSEServerTransport>();

    const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

      try {
        if (url.pathname === '/sse' && req.method === 'GET') {
          const transport = new SSEServerTransport('/messages', res);
          const sseSessionId = transport.sessionId;
          sseTransports.set(sseSessionId, transport);

          transport.onclose = () => {
            sseTransports.delete(sseSessionId);
          };

          const sessionServer = createMcpServer(canvasBridge);
          await sessionServer.connect(transport);
          return;
        }

        if (url.pathname === '/messages' && req.method === 'POST') {
          const targetSessionId = url.searchParams.get('sessionId');
          if (targetSessionId && sseTransports.has(targetSessionId)) {
            const transport = sseTransports.get(targetSessionId)!;
            await transport.handlePostMessage(req, res);
            return;
          }
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Missing or unknown sessionId parameter');
          return;
        }

        if (url.pathname === '/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', sessions: bridgeServer.getSessionCount() }));
          return;
        }

        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found. MCP SSE endpoint is at /sse');
      } catch (err) {
        console.error('[Slate MCP] HTTP Handler Error:', err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
        }
      }
    });

    httpServer.listen(httpPort, '127.0.0.1', () => {
      console.log(`[Slate MCP] MCP SSE server listening on http://127.0.0.1:${httpPort}/sse`);
      console.log(`[Slate MCP] Connect your MCP client (e.g. Antigravity) to this endpoint.`);
    });
  } else {
    // Run as stdio server (default for Antigravity)
    console.error(`[Slate MCP] Starting StdioServerTransport...`);
    const mcpServer = createMcpServer(canvasBridge);
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
    console.error(`[Slate MCP] Server is ready and accepting tool calls over stdio.`);
  }

  // Graceful shutdown
  const shutdown = async () => {
    console.error(`[Slate MCP] Shutting down...`);
    await bridgeServer.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[Slate MCP] Fatal error:', err);
  process.exit(1);
});
