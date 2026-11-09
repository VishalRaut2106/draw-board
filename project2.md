# Project: Integrate an MCP Server into My Existing Whiteboard Website

## Role

Act as a senior full-stack engineer specializing in Model Context Protocol (MCP), TypeScript, real-time communication, frontend architecture, and interactive canvas applications.

I already have an existing sketch-style whiteboard website. Your task is to extend my existing project so that AI coding agents, especially Google Antigravity, can connect to my whiteboard through an MCP server and directly create, edit, organize, and manage diagrams on the actual whiteboard canvas.

**This is an integration task, not a request to build a new whiteboard from scratch.**

Do not replace my existing application, redesign its entire UI, or introduce an unrelated drawing engine. Preserve the current functionality and architecture wherever possible.

## 1. First: Inspect the Existing Project

Before modifying any files:

1. Inspect the entire project structure.
2. Identify the frontend framework, language, package manager, routing, state management, and existing drawing library.
3. Find the current canvas implementation and determine how shapes, text, connectors, groups, selection, and drawing state are represented.
4. Identify existing functions or APIs for creating, updating, deleting, loading, and exporting drawing elements.
5. Determine how the canvas state is stored and how changes are rendered.
6. Check whether the application already has a backend, WebSocket server, API routes, authentication, persistence, or an existing MCP implementation.
7. Inspect package.json and existing dependencies before adding new packages.
8. Identify how the application is started and deployed.

Create a concise implementation plan based on the actual repository.

Do not assume that the project uses Excalidraw, Next.js, React, or any particular library. Verify this from the codebase first.

Reuse existing abstractions wherever possible. If a required capability does not exist, implement the smallest compatible extension.

## 2. Primary Objective

Enable Antigravity to interact with my existing whiteboard using MCP tools.

The intended workflow is:

User instruction
    |
    v
Antigravity AI agent
    |
    | MCP tool calls
    v
My MCP server
    |
    | Validated drawing operations
    v
Whiteboard communication bridge
    |
    v
Existing browser canvas
    |
    v
Visible, editable sketch-style diagram

For example, I should be able to ask Antigravity:

"Create a complete e-commerce architecture with a frontend, API gateway, authentication service, product service, order service, Redis cache, PostgreSQL database, payment gateway, and message queue. Connect the components correctly and organize the diagram into logical groups."

Antigravity should call the appropriate MCP tools and the diagram should appear on my existing whiteboard without requiring me to manually recreate the elements.

The output must be real, editable canvas elements—not a generated screenshot, static image, or unrelated Mermaid preview.

## 3. MCP Server Implementation

Implement a proper MCP server using the official TypeScript MCP SDK, if TypeScript is compatible with the existing project.

Use a currently supported MCP transport appropriate to the deployment environment.

Preferred approach:

- Use Streamable HTTP for a remotely accessible MCP server.
- Use stdio when a local MCP process is more appropriate or required by the target client.
- If necessary, implement separate transport adapters while keeping the drawing logic shared.

Do not implement a fake MCP endpoint or a custom JSON API and describe it as MCP.

Use official SDK APIs and verify their compatibility with the installed dependency versions.

Organize the server code cleanly. For example, adapt this structure to the existing repository rather than blindly creating it:

src/
  mcp/
    server.ts
    tools/
      canvas-tools.ts
      shape-tools.ts
      connector-tools.ts
      diagram-tools.ts
    validation/
      schemas.ts
    bridge/
      canvas-bridge.ts
    types/
      canvas.ts

Keep protocol handling, input validation, drawing operations, and browser communication separated.

## 4. Implement the Drawing MCP Tools

Expose useful tools that the AI agent can discover and call.

### A. Canvas inspection

`get_canvas_state`

Return the current canvas information, including:
- Canvas/session identifier.
- Existing element IDs and element types.
- Labels and relevant properties.
- Positions and dimensions.
- Relationships and connector endpoints.
- Groups or frames, where supported.
- Current selection or viewport information, where available.

Support pagination or concise summaries for large diagrams. Do not expose secrets or unrelated user data.

`get_canvas_summary`

Return a compact summary of the current diagram, its main components, and their relationships.

### B. Shape creation

`create_shape`

Inputs should support the shape types that the existing canvas actually supports, such as:
- Rectangle.
- Ellipse.
- Diamond.
- Rounded rectangle, if available.
- Other existing supported shapes.

Allow appropriate properties such as:
- Label or text.
- Position.
- Width and height.
- Fill and stroke.
- Stroke width.
- Sketch-style rendering properties supported by the existing engine.
- Optional group or container.
- Optional metadata.

Use sensible defaults and validate all inputs.

Return the created element ID and its actual canvas properties.

`create_text`

Create editable text labels, headings, annotations, and notes using the existing canvas text system.

`update_shape`

Update supported properties of an existing element without recreating it unnecessarily.

`delete_shape`

Delete an element and correctly handle dependent connectors or relationships.

`duplicate_shape`

Duplicate an element using new unique IDs and preserve only the relationships that can safely be duplicated.

### C. Connectors and relationships

`connect_shapes`

Connect two existing elements using the connector system supported by the canvas.

Inputs should include:
- Source element ID.
- Target element ID.
- Direction or arrowhead configuration.
- Optional label.
- Optional connector style.
- Optional routing preference.

The connector must remain associated with its endpoints when the elements move, if the drawing engine supports bound connectors.

Never create a connector pointing to a nonexistent element.

`update_connector`

Modify a connector's label, endpoints, routing, or style where supported.

`delete_connector`

Remove a specific connector without deleting its connected shapes.

### D. Diagram operations

`group_elements`

Group related elements using the native grouping functionality, if available.

`arrange_diagram`

Arrange selected or all relevant elements into a readable layout.

Support layout strategies such as:
- Left-to-right.
- Top-to-bottom.
- Hierarchical.
- Grouped by logical subsystem.

Avoid overlapping elements and labels. Keep connectors readable and minimize unnecessary crossings.

If the existing project has no graph-layout engine, implement a simple deterministic layout algorithm or integrate a suitable lightweight library.

`move_elements`

Move multiple elements while preserving their relative positions and connector relationships.

`clear_canvas`

Clear the canvas only when explicitly requested. Require an explicit confirmation parameter or equivalent safeguard for destructive operations.

`undo_last_operation`

Undo the last AI operation where supported. If the drawing engine provides a native history mechanism, integrate with it rather than implementing a conflicting history system.

`export_diagram`

Export the current diagram using formats supported by the existing application, such as PNG, SVG, or its native editable format.

Only expose formats that can actually be implemented and tested.

## 5. Build a Reliable Browser-to-MCP Bridge

This is one of the most important parts of the implementation.

The MCP server and the whiteboard browser may run as separate processes. A successful MCP tool call must reach the correct active canvas and result in a visible change.

Inspect the current frontend architecture and choose the most compatible approach.

Possible implementations include:

- WebSocket communication between a local MCP server and the browser.
- An authenticated real-time channel for a remotely hosted application.
- A local bridge API if the existing application already has a suitable mechanism.

Do not introduce a second independent canvas state that becomes inconsistent with the visible canvas.

The existing application must remain the source of truth for its drawing state.

Implement the following capabilities:

1. Register or identify the active whiteboard session.
2. Associate incoming commands with the correct canvas.
3. Send validated operations to the frontend.
4. Apply the operations through the existing drawing engine or state-management layer.
5. Wait for the operation to complete.
6. Return a success or failure result to the MCP tool caller.
7. Return the real created or updated element IDs.
8. Handle browser disconnection and reconnection.
9. Handle unavailable or expired sessions.
10. Prevent duplicate execution of retried operations where practical.

Do not return success merely because a command was sent. Return success only after the frontend has acknowledged the actual operation.

Use request IDs and operation IDs where appropriate.

If a browser is not connected, return an actionable error instead of pretending the drawing succeeded.

If multiple boards or browser sessions are supported, ensure that commands cannot accidentally modify the wrong board.

## 6. Antigravity Integration

Make the MCP server discoverable and usable by Antigravity through its supported MCP configuration mechanism.

Provide setup instructions for both applicable scenarios:

### Local development

Explain how to start the whiteboard and MCP server, and provide a valid MCP configuration example using the actual executable or script paths and required environment variables.

### Remote deployment

If remote access is supported, document the actual MCP endpoint, authentication requirements, and supported transport.

Use the exact endpoint implemented by the application. Do not invent a production URL.

Document any additional client-specific setup requirements verified from the official Antigravity documentation.

After configuration, Antigravity should be able to discover the drawing tools and invoke them during a normal conversation.

Do not hardcode API keys, tokens, machine-specific paths, or credentials into source code.

## 7. Canvas State and Data Integrity

All AI drawing operations must use the existing canvas data model.

Requirements:

- Every element must have a unique, stable ID.
- Connectors must reference valid endpoints.
- Updates should preserve element identity where possible.
- Existing user-created elements must not be overwritten unintentionally.
- AI operations must preserve native sketch rendering and editing capabilities.
- Unsupported element types must produce clear validation errors.
- Large operations should be processed in manageable batches.
- Partial failures must be reported accurately.
- A failed operation must not be reported as a fully successful diagram generation.

Implement an operation boundary or transaction-like workflow where practical.

For complex diagrams, validate the complete requested operation plan before applying destructive changes. Do not promise full atomic transactions if the underlying drawing engine does not support them.

If the canvas changes while the agent is working, avoid blindly replacing the latest state with an outdated snapshot.

## 8. Security Requirements

Treat the MCP server as a privileged interface to the user's whiteboard.

Implement appropriate protections for the chosen deployment model:

- Validate every MCP tool input using a schema-validation library compatible with the project.
- Authenticate remote connections.
- Use secure transport for remote access.
- Restrict browser bridge connections to authorized clients.
- Apply origin checks and appropriate browser connection protections.
- Avoid unrestricted cross-origin access.
- Do not expose arbitrary filesystem access, shell execution, or arbitrary JavaScript execution through drawing tools.
- Prevent unauthorized canvas access across users or sessions.
- Apply reasonable limits to element counts, payload sizes, and operation batches.
- Protect destructive operations with explicit intent checks.
- Avoid logging secrets, access tokens, or sensitive canvas contents unnecessarily.
- Keep local development credentials and production credentials separate.

For local development, bind services to loopback interfaces where appropriate. For remote deployment, use a proper authenticated deployment architecture rather than exposing an unrestricted local bridge to the internet.

## 9. Preserve the Existing Website

Do not break the current application.

Preserve:
- Existing routes and pages.
- Current UI and styling.
- Manual drawing.
- Dragging and resizing.
- Selection and deletion.
- Text editing.
- Existing save/load behavior.
- Current export functionality.
- Existing keyboard shortcuts.
- Current dependencies unless changes are necessary.

Do not migrate the project to a different framework just to simplify the MCP implementation.

Keep the MCP integration modular so it can be disabled without breaking normal whiteboard usage.

Add only the UI required for useful integration status, such as:
- MCP connection status.
- Active board/session indicator.
- Recent AI operations.
- Error or connection messages.

Follow the existing design system.

## 10. Testing Requirements

Implement automated tests using the existing test framework, or introduce a lightweight compatible testing setup if none exists.

At minimum, test the following:

1. MCP server starts successfully.
2. MCP client can initialize and discover tools.
3. A valid shape-creation request creates a real canvas element.
4. The created element is visible in the active browser canvas.
5. The returned element ID matches the actual canvas element.
6. Two shapes can be connected successfully.
7. The connector references valid endpoints.
8. Existing shapes can be updated without duplication.
9. Deletion correctly handles dependent connectors.
10. Invalid inputs are rejected.
11. Disconnected browsers produce a clear error.
12. Commands are routed to the correct board.
13. Retried requests do not unexpectedly duplicate operations where idempotency is implemented.
14. Existing whiteboard functionality still works.
15. The documented Antigravity configuration matches the actual server implementation.

Use unit tests for tool logic, integration tests for the bridge, and browser tests where the project's infrastructure supports them.

Do not claim that a test passed unless you actually ran it and verified the result.

## 11. End-to-End Acceptance Test

The integration is not complete until this entire scenario works.

Start the website and MCP server.

Connect Antigravity to the MCP server.

Ask Antigravity:

"Create a simple system architecture with a Client, API Gateway, Backend Service, and PostgreSQL database. Arrange the components from left to right and connect them with directional arrows."

Expected result:

- Antigravity discovers and uses the MCP tools.
- The active whiteboard receives the commands.
- Four actual editable shapes appear on the canvas.
- Labels are readable.
- Connectors reference the correct shapes.
- The layout is understandable.
- The result remains editable using the existing UI.
- The MCP response accurately reports success.
- No screenshot-based workaround is used.

Next, ask:

"Add a Redis cache between the Backend Service and PostgreSQL. Update the diagram without recreating unrelated elements."

Expected result:

- The existing diagram is inspected first.
- Redis is added as a new element.
- Relevant connectors are updated.
- Existing unrelated elements retain their identities.
- The final diagram remains valid.

## 12. Implementation Workflow

Follow this sequence:

Phase 1: Inspect the repository and produce an implementation plan.

Phase 2: Identify the canvas API and implement reusable drawing operations.

Phase 3: Implement MCP tools and their input schemas.

Phase 4: Implement the communication bridge and active-session handling.

Phase 5: Connect Antigravity and verify tool discovery.

Phase 6: Run automated tests and the end-to-end acceptance tests.

Phase 7: Document setup, configuration, supported tools, limitations, and deployment.

Do not stop after writing a plan or creating placeholder files. Proceed with the actual implementation unless a genuine blocker requires clarification.

Avoid unnecessary rewrites, speculative abstractions, unrelated features, and placeholder implementations.

## 13. Final Deliverables

At completion, provide:

1. A summary of the existing architecture you discovered.
2. A list of files added or modified.
3. The final architecture of the MCP integration.
4. A list of implemented MCP tools and their input schemas.
5. The actual commands to install dependencies and run the application.
6. The Antigravity MCP configuration required for this project.
7. Local development and deployment instructions.
8. The test results, including any tests that could not be run.
9. Any known limitations or remaining work.
10. A short demonstration workflow I can follow to draw my first architecture diagram.

## Final instruction

Work directly within the existing repository. Inspect before editing, reuse the existing canvas implementation, make incremental changes, and verify the integration end to end.

The primary success criterion is simple:

**I should be able to instruct Antigravity to draw or modify a real architecture diagram on my existing whiteboard through MCP, and then continue editing that diagram manually on the same canvas.**