import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

async function exportSchemas() {
  const targetDir = 'C:\\Users\\visha\\.gemini\\antigravity-ide\\mcp\\slate-whiteboard';
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const transport = new SSEClientTransport(new URL('http://127.0.0.1:4445/sse'));
  const client = new Client({ name: 'schema-exporter', version: '1.0.0' });
  await client.connect(transport);

  const toolsResult = await client.listTools();
  console.log(`Found ${toolsResult.tools.length} tools.`);

  for (const tool of toolsResult.tools) {
    const filePath = path.join(targetDir, `${tool.name}.json`);
    const content = {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    };
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf-8');
    console.log(`Exported schema: ${tool.name}.json`);
  }

  // Create instructions.md
  const instructions = `# Slate Whiteboard MCP Server Instructions

## Overview
This MCP server integrates directly with the live Slate whiteboard canvas (Excalidraw-based).
You can inspect, create, update, delete, group, arrange, and style any whiteboard elements in real-time.

## Key Tools
- **create_shape**: Create boxes, diamonds, ellipses with rich colors, borders, and labels.
- **create_text**: Add headings, titles, subtitles, and annotations.
- **connect_shapes**: Connect any two components with directional, labeled arrows.
- **create_diagram**: Batch create a full architecture diagram with nodes, connectors, and auto-layout in one call.
- **clear_canvas**: Clear previous canvas before drawing a new diagram.
- **get_canvas_summary**: Fetch the current elements, shapes, connectors, and groups on canvas.
- **arrange_diagram**: Auto-organize shapes into left-to-right, top-to-bottom, or hierarchical layouts.

## Design Best Practices for Clean Whiteboard Architecture:
1. **Title Banner**: Always include a clear title and subtitle at the top.
2. **Grid Spacing**: Keep 150px-200px horizontal and vertical gaps between components so connector arrows and labels never overlap.
3. **Sticky Notes**: Add educational, color-coded sticky notes (Yellow for Security/Sandboxing, Orange for High-Load/Contest Spikes, Mint for Real-Time/WebSockets) with clear bullet points.
4. **Vibrant Dark-Theme Colors**:
   - Use high-contrast stroke colors (#38bdf8 cyan, #a78bfa purple, #34d399 emerald, #fb923c orange, #fbbf24 amber, #fde047 yellow).
   - Use deep background cards (#0f172a, #1e1b4b, #064e3b, #431407, #422006).
`;

  fs.writeFileSync(path.join(targetDir, 'instructions.md'), instructions, 'utf-8');
  console.log('Exported instructions.md');

  await client.close();
  console.log('Finished exporting MCP tool schemas successfully!');
}

exportSchemas().catch((err) => {
  console.error(err);
  process.exit(1);
});
