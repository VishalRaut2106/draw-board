# Slate Whiteboard + Model Context Protocol (MCP) Integration

Slate is a personal sketch-style whiteboard application powered by Excalidraw, enhanced with an official TypeScript **Model Context Protocol (MCP)** server.

This integration allows AI coding agents—specifically **Google Antigravity**—to directly create, edit, connect, arrange, and manage diagrams on the active browser canvas in real time while preserving full manual editing capabilities.

---

## 🌟 Key Features

- **17 Native MCP Tools**: Create shapes, bound connector arrows, free text, layout arrangements, grouping, translations, state inspection, and canvas exports.
- **Bi-Directional WebSocket Bridge**: Real-time communication bridge (`ws://127.0.0.1:4444`) connecting the MCP server and active browser sessions.
- **Dual Transport Support**:
  - **stdio transport** (default, ideal for local Antigravity MCP integration).
  - **SSE / HTTP transport** (listening on `http://127.0.0.1:4445/sse` for remote or multi-client setups).
- **Deterministic Auto-Layout Engine**: Built-in Sugiyama-style graph layout supporting `left-to-right`, `top-to-bottom`, `hierarchical`, and `grid` arrangements without overlapping.
- **Safe Canvas Integrity**:
  - Stable element IDs and bound connector maintenance.
  - Safe element deletion with cascade cleanup of dependent connectors.
  - Destructive safeguard (`clear_canvas` requires `confirm: true`).
  - History snapshots for programmatic undo (`undo_last_operation`).
  - Idempotency caching to prevent duplicate creations on retries.
- **Minimal UI Footprint**: Non-intrusive floating status indicator in Slate's dark theme showing real-time bridge status, active session ID, and recent AI actions.

---

## 🛠️ Architecture

```
User Instruction
      │
      ▼
Antigravity AI Agent
      │
      │ MCP Tool Calls (JSON-RPC)
      ▼
Slate MCP Server (stdio / SSE)
      │
      │ Validated operations (Zod)
      ▼
WebSocket Bridge Server (ws://127.0.0.1:4444)
      │
      ▼
Slate Browser Canvas (Excalidraw Imperative API)
      │
      ▼
Real, editable sketch diagram with auto-layout
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Whiteboard Application

In one terminal, start the Vite dev server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. You will see the **"MCP Bridge: Active"** status badge in the bottom-left corner.

### 3. Start the MCP Server

You can run the MCP server in either **stdio** mode (for local IDE integration) or **HTTP/SSE** mode:

#### Option A: stdio mode (Default for Antigravity)

```bash
npm run mcp
```

#### Option B: SSE / HTTP mode

```bash
npm run mcp:http
```

*Endpoints:*
- MCP SSE: `http://127.0.0.1:4445/sse`
- Health check: `http://127.0.0.1:4445/health`
- WebSocket Bridge: `ws://127.0.0.1:4444`

---

## 🤖 Antigravity MCP Configuration

Add the server to your Antigravity MCP configuration (e.g., in your project or global `mcp_config.json`):

### Option 1: stdio Configuration (Recommended for local dev)

```json
{
  "mcpServers": {
    "slate-whiteboard": {
      "command": "npx",
      "args": ["-y", "tsx", "src/mcp/index.ts"],
      "env": {
        "BRIDGE_PORT": "4444"
      }
    }
  }
}
```

### Option 2: SSE Configuration (For background daemon or remote access)

```json
{
  "mcpServers": {
    "slate-whiteboard": {
      "url": "http://127.0.0.1:4445/sse"
    }
  }
}
```

---

## 📦 Implemented MCP Tools

| Tool Name | Category | Description |
|---|---|---|
| `get_canvas_state` | Inspection | Returns full or paginated canvas elements, bounds, viewport, and groups. |
| `get_canvas_summary` | Inspection | Returns a concise overview of labeled shapes, connector links, and counts. |
| `create_shape` | Shapes | Creates a rectangle, ellipse, or diamond with text label and custom styles. |
| `create_text` | Text | Creates standalone editable text annotations at coordinates. |
| `update_shape` | Shapes | Modifies properties (position, size, label, colors) of an existing shape. |
| `delete_shape` | Shapes | Deletes a shape and cleans up connected arrows to prevent dangling edges. |
| `duplicate_shape` | Shapes | Duplicates an element with an offset and new unique ID. |
| `connect_shapes` | Connectors | Creates a directional arrow bound between two shapes. |
| `update_connector` | Connectors | Updates arrow label, routing, stroke, or endpoints. |
| `delete_connector` | Connectors | Deletes an arrow without deleting the connected shapes. |
| `group_elements` | Organization | Groups two or more elements into an Excalidraw group. |
| `arrange_diagram` | Layout | Applies auto-layout (`left-to-right`, `top-to-bottom`, `hierarchical`, `grid`). |
| `move_elements` | Diagram | Translates elements by `deltaX` and `deltaY` preserving relative layout. |
| `create_diagram` | Batch | Generates multi-component architectures with auto-layout in a single call. |
| `clear_canvas` | Destructive | Clears all canvas elements (safeguard: requires `confirm: true`). |
| `undo_last_operation` | History | Reverts the last AI drawing operation. |
| `export_diagram` | Export | Exports whiteboard diagram to SVG, PNG (data URL), or JSON. |

---

## 🧪 Testing

Run the automated test suite with Vitest:

```bash
npm run test
```

Run the end-to-end acceptance scenarios (Architecture + Redis Cache update):

```bash
npx tsx test/run-e2e-scenario.ts
```
