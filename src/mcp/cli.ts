import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import * as fs from 'node:fs';

const MCP_URL = process.env.MCP_URL || 'http://127.0.0.1:4445/sse';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(`
Slate Whiteboard MCP CLI
========================
Usage:
  npx tsx src/mcp/cli.ts tool <tool_name> '<json_arguments>'
  npx tsx src/mcp/cli.ts draw <diagram_json_path_or_json_string>
  npx tsx src/mcp/cli.ts clear
  npx tsx src/mcp/cli.ts summary

Examples:
  npx tsx src/mcp/cli.ts clear
  npx tsx src/mcp/cli.ts tool create_shape '{"label":"Web UI","x":100,"y":100}'
  npx tsx src/mcp/cli.ts tool connect_shapes '{"sourceId":"a","targetId":"b","label":"1. Request"}'
  npx tsx src/mcp/cli.ts summary
`);
    return;
  }

  const transport = new SSEClientTransport(new URL(MCP_URL));
  const client = new Client({ name: 'slate-cli', version: '1.0.0' });

  try {
    await client.connect(transport);
  } catch (err) {
    console.error(`Failed to connect to MCP server at ${MCP_URL}: ${(err as Error).message}`);
    console.error('Make sure the MCP server is running (`npm run mcp:daemon` or `npx tsx src/mcp/index.ts --http`).');
    process.exit(1);
  }

  try {
    if (command === 'clear') {
      const res = await client.callTool({ name: 'clear_canvas', arguments: { confirm: true } });
      console.log(res.content[0].text);
    } else if (command === 'summary') {
      const res = await client.callTool({ name: 'get_canvas_summary', arguments: {} });
      console.log(res.content[0].text);
    } else if (command === 'tool') {
      const toolName = args[1];
      if (!toolName) {
        console.error('Error: tool name required. Example: npx tsx src/mcp/cli.ts tool get_canvas_summary "{}"');
        process.exit(1);
      }
      const rawArgs = args[2] || '{}';
      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = JSON.parse(rawArgs);
      } catch (e) {
        console.error(`Error: invalid JSON arguments: ${rawArgs}`);
        process.exit(1);
      }
      const res = await client.callTool({ name: toolName, arguments: parsedArgs });
      if (res.isError) {
        console.error(`MCP Tool Error: ${res.content?.[0]?.text}`);
        process.exit(1);
      }
      console.log(res.content?.[0]?.text);
    } else if (command === 'draw') {
      const input = args[1];
      if (!input) {
        console.error('Error: file path or JSON required. Example: npx tsx src/mcp/cli.ts draw diagram.json');
        process.exit(1);
      }

      let diagramData: any;
      if (fs.existsSync(input)) {
        diagramData = JSON.parse(fs.readFileSync(input, 'utf-8'));
      } else {
        diagramData = JSON.parse(input);
      }

      // Check if diagramData contains clear: true
      if (diagramData.clear) {
        console.log('Clearing canvas before drawing...');
        await client.callTool({ name: 'clear_canvas', arguments: { confirm: true } });
      }

      // If diagramData has title
      if (diagramData.title) {
        await client.callTool({
          name: 'create_text',
          arguments: {
            text: diagramData.title,
            x: diagramData.titleX ?? 60,
            y: diagramData.titleY ?? 35,
            fontSize: diagramData.titleFontSize ?? 28,
            fontFamily: 2,
            strokeColor: '#f8fafc',
          },
        });
      }

      // If diagramData has subtitle
      if (diagramData.subtitle) {
        await client.callTool({
          name: 'create_text',
          arguments: {
            text: diagramData.subtitle,
            x: diagramData.subtitleX ?? 60,
            y: diagramData.subtitleY ?? 72,
            fontSize: 16,
            fontFamily: 1,
            strokeColor: '#94a3b8',
          },
        });
      }

      // Create shapes
      if (Array.isArray(diagramData.shapes)) {
        console.log(`Creating ${diagramData.shapes.length} shapes...`);
        for (const shape of diagramData.shapes) {
          await client.callTool({ name: 'create_shape', arguments: shape });
        }
      }

      // Create connectors
      if (Array.isArray(diagramData.connectors)) {
        console.log(`Creating ${diagramData.connectors.length} connectors...`);
        for (const conn of diagramData.connectors) {
          await client.callTool({ name: 'connect_shapes', arguments: conn });
        }
      }

      // Create sticky notes
      if (Array.isArray(diagramData.stickyNotes)) {
        console.log(`Creating ${diagramData.stickyNotes.length} sticky notes...`);
        for (const note of diagramData.stickyNotes) {
          await client.callTool({ name: 'create_shape', arguments: note });
        }
      }

      console.log('Fetching canvas summary...');
      const summaryRes = await client.callTool({ name: 'get_canvas_summary', arguments: {} });
      console.log('Summary:', summaryRes.content?.[0]?.text);
      console.log('✅ Diagram successfully drawn via MCP!');
    } else {
      console.error(`Unknown command: ${command}. Run with --help for options.`);
      process.exit(1);
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error('Fatal CLI error:', err);
  process.exit(1);
});
