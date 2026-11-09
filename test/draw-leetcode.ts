import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

function parseResult(res: any, toolName: string) {
  if (res.isError) {
    throw new Error(`Tool "${toolName}" returned error: ${res.content?.[0]?.text}`);
  }
  return JSON.parse(res.content[0].text);
}

async function drawLeetCodeArchitecture() {
  console.log('Connecting to Slate MCP server at http://127.0.0.1:4445/sse ...');
  const transport = new SSEClientTransport(new URL('http://127.0.0.1:4445/sse'));
  const client = new Client({ name: 'leetcode-designer', version: '1.0.0' });

  await client.connect(transport);
  console.log('Connected to MCP server!');

  // 1. Clear previous canvas
  console.log('Clearing canvas...');
  const clearRes = await client.callTool({
    name: 'clear_canvas',
    arguments: { confirm: true },
  });
  parseResult(clearRes, 'clear_canvas');

  // 2. Add Title Heading
  console.log('Adding title header...');
  await client.callTool({
    name: 'create_text',
    arguments: {
      text: '🚀 LeetCode System Design Architecture',
      x: 60,
      y: 35,
      fontSize: 28,
      fontFamily: 2, // Helvetica / Clean
      strokeColor: '#f8fafc',
    },
  });

  await client.callTool({
    name: 'create_text',
    arguments: {
      text: 'An intuitive guide: How code submissions are safely isolated, judged, and broadcast in real-time',
      x: 60,
      y: 72,
      fontSize: 16,
      fontFamily: 1, // Virgil / Hand-drawn feel
      strokeColor: '#94a3b8',
    },
  });

  // 3. Create Core Architecture Components (Spacious 4-column layout)
  console.log('Creating core architecture components...');

  // Column 1: Coder Browser (Client)
  await client.callTool({
    name: 'create_shape',
    arguments: {
      id: 'coder_browser',
      type: 'rectangle',
      label: '🧑‍💻 Coder Browser\n(Web & Mobile UI)',
      x: 60,
      y: 130,
      width: 200,
      height: 85,
      backgroundColor: '#0f172a',
      strokeColor: '#38bdf8',
      strokeWidth: 2,
    },
  });

  // Column 2 - Top: API Gateway & Rate Limiter
  await client.callTool({
    name: 'create_shape',
    arguments: {
      id: 'api_gateway',
      type: 'rectangle',
      label: '🌐 API Gateway\n& Rate Limiter',
      x: 440,
      y: 130,
      width: 210,
      height: 85,
      backgroundColor: '#1e1b4b',
      strokeColor: '#a78bfa',
      strokeWidth: 2,
    },
  });

  // Column 3 - Top: Problem & User Service
  await client.callTool({
    name: 'create_shape',
    arguments: {
      id: 'problem_service',
      type: 'rectangle',
      label: '📚 Problem & User\nBackend Service',
      x: 820,
      y: 130,
      width: 220,
      height: 85,
      backgroundColor: '#134e4a',
      strokeColor: '#2dd4bf',
      strokeWidth: 2,
    },
  });

  // Column 4 - Top: Fast Redis Cache
  await client.callTool({
    name: 'create_shape',
    arguments: {
      id: 'redis_cache',
      type: 'rectangle',
      label: '⚡ Redis Cache (Hot Data)',
      x: 1200,
      y: 110,
      width: 220,
      height: 55,
      backgroundColor: '#4c0519',
      strokeColor: '#fb7185',
      strokeWidth: 2,
    },
  });

  // Column 4 - Mid-Top: PostgreSQL Database
  await client.callTool({
    name: 'create_shape',
    arguments: {
      id: 'postgres_db',
      type: 'rectangle',
      label: '🗄️ PostgreSQL DB (Problem Bank)',
      x: 1200,
      y: 180,
      width: 220,
      height: 55,
      backgroundColor: '#451a03',
      strokeColor: '#fbbf24',
      strokeWidth: 2,
    },
  });

  // Column 2 - Row 2: Submission Queue (Kafka)
  await client.callTool({
    name: 'create_shape',
    arguments: {
      id: 'submission_queue',
      type: 'rectangle',
      label: '📥 Submission Queue\n(Kafka / RabbitMQ)',
      x: 440,
      y: 330,
      width: 210,
      height: 85,
      backgroundColor: '#431407',
      strokeColor: '#fb923c',
      strokeWidth: 2,
    },
  });

  // Column 3 - Row 2: Judge Worker Fleet (Sandboxed Docker Execution)
  await client.callTool({
    name: 'create_shape',
    arguments: {
      id: 'judge_workers',
      type: 'rectangle',
      label: '⚖️ Code Judge Workers\n(Docker Sandbox Fleet)',
      x: 820,
      y: 330,
      width: 220,
      height: 85,
      backgroundColor: '#064e3b',
      strokeColor: '#34d399',
      strokeWidth: 2,
    },
  });

  // Column 4 - Row 2: Test Case Storage (S3)
  await client.callTool({
    name: 'create_shape',
    arguments: {
      id: 'test_storage',
      type: 'rectangle',
      label: '📦 Test Storage (S3)\n(Hidden I/O Testcases)',
      x: 1200,
      y: 330,
      width: 220,
      height: 85,
      backgroundColor: '#172554',
      strokeColor: '#60a5fa',
      strokeWidth: 2,
    },
  });

  // Column 2 - Row 3: WebSocket Broadcaster (Real-Time Push)
  await client.callTool({
    name: 'create_shape',
    arguments: {
      id: 'ws_broadcaster',
      type: 'rectangle',
      label: '📡 WebSocket Service\n(Live Result Broadcaster)',
      x: 440,
      y: 470,
      width: 210,
      height: 80,
      backgroundColor: '#3b0764',
      strokeColor: '#c084fc',
      strokeWidth: 2,
    },
  });

  // 4. Create Connectors Linking the Flow
  console.log('Connecting components with clean, directional labeled arrows...');

  // 1. User -> API Gateway
  await client.callTool({
    name: 'connect_shapes',
    arguments: {
      sourceId: 'coder_browser',
      targetId: 'api_gateway',
      label: '1. Submit Code',
      strokeColor: '#38bdf8',
    },
  });

  // API Gateway -> Problem Service (Read queries)
  await client.callTool({
    name: 'connect_shapes',
    arguments: {
      sourceId: 'api_gateway',
      targetId: 'problem_service',
      label: 'Fetch Problems',
      strokeColor: '#a78bfa',
    },
  });

  // Problem Service -> Redis Cache
  await client.callTool({
    name: 'connect_shapes',
    arguments: {
      sourceId: 'problem_service',
      targetId: 'redis_cache',
      label: '1. Fast Cache',
      strokeColor: '#fb7185',
    },
  });

  // Problem Service -> PostgreSQL
  await client.callTool({
    name: 'connect_shapes',
    arguments: {
      sourceId: 'problem_service',
      targetId: 'postgres_db',
      label: '2. DB Query',
      strokeColor: '#fbbf24',
    },
  });

  // 2. API Gateway -> Submission Queue (Async Push)
  await client.callTool({
    name: 'connect_shapes',
    arguments: {
      sourceId: 'api_gateway',
      targetId: 'submission_queue',
      label: '2. Push to Queue',
      strokeColor: '#fb923c',
    },
  });

  // 3. Submission Queue -> Judge Workers (Pull Task)
  await client.callTool({
    name: 'connect_shapes',
    arguments: {
      sourceId: 'submission_queue',
      targetId: 'judge_workers',
      label: '3. Pull Next Job',
      strokeColor: '#fb923c',
    },
  });

  // 4. Judge Workers <-> Test Cases (S3)
  await client.callTool({
    name: 'connect_shapes',
    arguments: {
      sourceId: 'judge_workers',
      targetId: 'test_storage',
      label: '4. Load Testcases',
      strokeColor: '#60a5fa',
    },
  });

  // 5. Judge Workers -> WebSocket Broadcaster
  await client.callTool({
    name: 'connect_shapes',
    arguments: {
      sourceId: 'judge_workers',
      targetId: 'ws_broadcaster',
      label: '5. Emit Verdict',
      strokeColor: '#c084fc',
    },
  });

  // 6. WebSocket Broadcaster -> User Browser (Real-time Stream)
  await client.callTool({
    name: 'connect_shapes',
    arguments: {
      sourceId: 'ws_broadcaster',
      targetId: 'coder_browser',
      label: '6. Push Live Verdict (🎉 Accepted)',
      strokeColor: '#34d399',
      strokeStyle: 'dashed',
    },
  });

  // 5. Create Educational Sticky Notes (High contrast, clearly readable)
  console.log('Adding educational sticky notes...');

  // Sticky Note 1: Contest Spikes & Queue (Orange)
  await client.callTool({
    name: 'create_shape',
    arguments: {
      id: 'sticky_queue',
      type: 'rectangle',
      label: '⚡ STICKY NOTE: Contest Traffic Spikes\n• Why do we need a Queue?\n• During weekly contests, 50,000+ coders\n  submit code within seconds!\n• Without Kafka, web servers would crash\n• The queue acts as a shock absorber\n  so workers judge steadily.',
      x: 60,
      y: 590,
      width: 380,
      height: 160,
      backgroundColor: '#431407',
      strokeColor: '#fb923c', // bright orange for glowing text
      strokeWidth: 2,
    },
  });

  // Sticky Note 2: Docker Sandboxing & Security (Yellow)
  await client.callTool({
    name: 'create_shape',
    arguments: {
      id: 'sticky_sandbox',
      type: 'rectangle',
      label: '🔒 STICKY NOTE: Untrusted Code Sandbox\n• How do we run dangerous user code safely?\n• Each run gets an isolated Docker/nsjail box\n• CPU limit: 2.0 seconds (kills infinite loops)\n• RAM limit: 256MB (prevents memory attacks)\n• ZERO network access (no hacking or malware)',
      x: 480,
      y: 590,
      width: 440,
      height: 160,
      backgroundColor: '#422006',
      strokeColor: '#fde047', // bright canary yellow for glowing text
      strokeWidth: 2,
    },
  });

  // Sticky Note 3: WebSockets vs Polling (Mint Green)
  await client.callTool({
    name: 'create_shape',
    arguments: {
      id: 'sticky_websockets',
      type: 'rectangle',
      label: '📡 STICKY NOTE: Real-Time Live Status\n• Why WebSockets instead of page refresh?\n• Saves millions of polling requests\n• Streams instant execution events:\n  1. "Compiling code..."\n  2. "Running test 42/60..."\n  3. "Accepted 🎉 (38ms, Beats 94%)"',
      x: 960,
      y: 590,
      width: 420,
      height: 160,
      backgroundColor: '#052e16',
      strokeColor: '#4ade80', // bright mint green for glowing text
      strokeWidth: 2,
    },
  });

  console.log('\nFetching canvas summary...');
  const summaryRes = await client.callTool({
    name: 'get_canvas_summary',
    arguments: {},
  });
  const summary = parseResult(summaryRes, 'get_canvas_summary');
  console.log('Canvas Summary:', summary);

  console.log('\n🎉 LeetCode System Design diagram successfully drawn on the whiteboard canvas!');
  await client.close();
}

drawLeetCodeArchitecture().catch((err) => {
  console.error('Drawing failed:', err);
  process.exit(1);
});
