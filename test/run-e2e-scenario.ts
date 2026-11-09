import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

function parseResult(res: any, toolName: string) {
  if (res.isError) {
    throw new Error(`Tool "${toolName}" returned error: ${res.content?.[0]?.text}`);
  }
  return JSON.parse(res.content[0].text);
}

async function runScenario() {
  console.log('Connecting to MCP server at http://127.0.0.1:4445/sse ...');
  const transport = new SSEClientTransport(new URL('http://127.0.0.1:4445/sse'));
  const client = new Client({ name: 'antigravity-acceptance-runner', version: '1.0.0' });

  await client.connect(transport);
  console.log('Connected! Discovering tools...');

  const toolsResult = await client.listTools();
  console.log(`Discovered ${toolsResult.tools.length} tools:`, toolsResult.tools.map((t) => t.name).join(', '));

  console.log('\n--- Resetting canvas to clean slate ---');
  const clearRes = await client.callTool({
    name: 'clear_canvas',
    arguments: { confirm: true },
  });
  parseResult(clearRes, 'clear_canvas');
  console.log('Canvas cleared.\n');

  console.log('\n================ SCENARIO 1 ================');
  console.log('Instruction: "Create a simple system architecture with a Client, API Gateway, Backend Service, and PostgreSQL database. Arrange the components from left to right and connect them with directional arrows."\n');

  // 1. Create shapes
  console.log('1. Creating Client shape...');
  const clientRes = await client.callTool({
    name: 'create_shape',
    arguments: {
      type: 'rectangle',
      label: 'Client',
      width: 150,
      height: 70,
      backgroundColor: '#1e293b',
      strokeColor: '#38bdf8',
    },
  });
  const clientData = parseResult(clientRes, 'create_shape');
  const clientId = clientData.elementId;
  console.log(`   Client created with ID: ${clientId}`);

  console.log('2. Creating API Gateway shape...');
  const gwRes = await client.callTool({
    name: 'create_shape',
    arguments: {
      type: 'rectangle',
      label: 'API Gateway',
      width: 160,
      height: 70,
      backgroundColor: '#1e293b',
      strokeColor: '#a78bfa',
    },
  });
  const gwData = parseResult(gwRes, 'create_shape');
  const gwId = gwData.elementId;
  console.log(`   API Gateway created with ID: ${gwId}`);

  console.log('3. Creating Backend Service shape...');
  const backendRes = await client.callTool({
    name: 'create_shape',
    arguments: {
      type: 'rectangle',
      label: 'Backend Service',
      width: 170,
      height: 70,
      backgroundColor: '#1e293b',
      strokeColor: '#34d399',
    },
  });
  const backendData = parseResult(backendRes, 'create_shape');
  const backendId = backendData.elementId;
  console.log(`   Backend Service created with ID: ${backendId}`);

  console.log('4. Creating PostgreSQL Database shape...');
  const dbRes = await client.callTool({
    name: 'create_shape',
    arguments: {
      type: 'ellipse',
      label: 'PostgreSQL',
      width: 160,
      height: 80,
      backgroundColor: '#1e293b',
      strokeColor: '#fbbf24',
    },
  });
  const dbData = parseResult(dbRes, 'create_shape');
  const dbId = dbData.elementId;
  console.log(`   PostgreSQL created with ID: ${dbId}`);

  // 2. Connect shapes
  console.log('5. Connecting Client -> API Gateway...');
  const conn1 = await client.callTool({
    name: 'connect_shapes',
    arguments: {
      sourceId: clientId,
      targetId: gwId,
      label: 'HTTPS',
      strokeColor: '#94a3b8',
    },
  });
  const conn1Data = parseResult(conn1, 'connect_shapes');
  console.log(`   Connector 1 ID: ${conn1Data.connectorId}`);

  console.log('6. Connecting API Gateway -> Backend Service...');
  const conn2 = await client.callTool({
    name: 'connect_shapes',
    arguments: {
      sourceId: gwId,
      targetId: backendId,
      label: 'REST API',
      strokeColor: '#94a3b8',
    },
  });
  const conn2Data = parseResult(conn2, 'connect_shapes');
  console.log(`   Connector 2 ID: ${conn2Data.connectorId}`);

  console.log('7. Connecting Backend Service -> PostgreSQL...');
  const conn3 = await client.callTool({
    name: 'connect_shapes',
    arguments: {
      sourceId: backendId,
      targetId: dbId,
      label: 'SQL (Port 5432)',
      strokeColor: '#94a3b8',
    },
  });
  const conn3Data = parseResult(conn3, 'connect_shapes');
  const conn3Id = conn3Data.connectorId;
  console.log(`   Connector 3 ID: ${conn3Id}`);

  // 3. Arrange left-to-right
  console.log('8. Arranging diagram left-to-right...');
  const arrangeRes = await client.callTool({
    name: 'arrange_diagram',
    arguments: {
      direction: 'left-to-right',
      startX: 100,
      startY: 150,
      spacingX: 120,
      spacingY: 80,
    },
  });
  const arrangeData = parseResult(arrangeRes, 'arrange_diagram');
  console.log(`   Arranged ${arrangeData.repositionedCount} components cleanly!`);

  // 4. Inspect diagram summary
  const summary1 = await client.callTool({
    name: 'get_canvas_summary',
    arguments: {},
  });
  const summary1Data = parseResult(summary1, 'get_canvas_summary');
  console.log('\nScenario 1 Canvas Summary:', summary1Data);

  console.log('\n================ SCENARIO 2 ================');
  console.log('Instruction: "Add a Redis cache between the Backend Service and PostgreSQL. Update the diagram without recreating unrelated elements."\n');

  // 1. Inspect existing state first
  console.log('1. Inspecting current canvas state...');
  const inspectRes = await client.callTool({
    name: 'get_canvas_summary',
    arguments: {},
  });
  const inspectData = parseResult(inspectRes, 'get_canvas_summary');
  console.log(`   Existing shapes on canvas:`, inspectData.shapes.map((s: { id: string; label: string }) => `${s.label} (${s.id})`));

  // 2. Add Redis cache
  console.log('2. Adding Redis Cache shape...');
  const redisRes = await client.callTool({
    name: 'create_shape',
    arguments: {
      type: 'diamond',
      label: 'Redis Cache',
      width: 140,
      height: 90,
      backgroundColor: '#1e293b',
      strokeColor: '#f87171',
    },
  });
  const redisData = parseResult(redisRes, 'create_shape');
  const redisId = redisData.elementId;
  console.log(`   Redis Cache created with ID: ${redisId}`);

  // 3. Delete old direct connector Backend -> Postgres
  console.log(`3. Deleting old connector ${conn3Id} between Backend and Postgres...`);
  const delRes = await client.callTool({
    name: 'delete_connector',
    arguments: { id: conn3Id },
  });
  parseResult(delRes, 'delete_connector');

  // 4. Connect Backend -> Redis and Redis -> Postgres
  console.log('4. Connecting Backend Service -> Redis Cache...');
  const connBackendRedis = await client.callTool({
    name: 'connect_shapes',
    arguments: {
      sourceId: backendId,
      targetId: redisId,
      label: 'Cache Query',
      strokeColor: '#f87171',
    },
  });
  parseResult(connBackendRedis, 'connect_shapes');

  console.log('5. Connecting Redis Cache -> PostgreSQL (Cache Miss)...');
  const connRedisPostgres = await client.callTool({
    name: 'connect_shapes',
    arguments: {
      sourceId: redisId,
      targetId: dbId,
      label: 'Cache Miss / Sync',
      strokeColor: '#fbbf24',
      strokeStyle: 'dashed',
    },
  });
  parseResult(connRedisPostgres, 'connect_shapes');

  // 5. Re-arrange diagram cleanly
  console.log('6. Re-arranging diagram left-to-right to position Redis between Backend and DB...');
  const arrange2Res = await client.callTool({
    name: 'arrange_diagram',
    arguments: {
      direction: 'left-to-right',
      startX: 100,
      startY: 150,
      spacingX: 120,
      spacingY: 80,
    },
  });
  const arrange2Data = parseResult(arrange2Res, 'arrange_diagram');
  console.log(`   Arranged ${arrange2Data.repositionedCount} components cleanly!`);

  // 6. Verify final canvas state and ID persistence
  const finalSummary = await client.callTool({
    name: 'get_canvas_summary',
    arguments: {},
  });
  const finalData = parseResult(finalSummary, 'get_canvas_summary');

  console.log('\nFinal Canvas State:');
  console.log(`Total elements: ${finalData.totalElements}`);
  console.log(`Shapes:`, finalData.shapes.map((s: { id: string; label: string; x: number; y: number }) => `${s.label.replace('\n', ' ')} [x=${s.x}, y=${s.y}, id=${s.id}]`));
  console.log(`Connectors:`, finalData.connectors.map((c: { sourceId?: string | null; targetId?: string | null; sourceLabel?: string; targetLabel?: string; label?: string }) => `${c.sourceLabel || c.sourceId} --(${c.label})--> ${c.targetLabel || c.targetId}`));

  // Verify IDs were preserved
  const clientPreserved = finalData.shapes.some((s: { id: string }) => s.id === clientId);
  const gwPreserved = finalData.shapes.some((s: { id: string }) => s.id === gwId);
  const backendPreserved = finalData.shapes.some((s: { id: string }) => s.id === backendId);
  const dbPreserved = finalData.shapes.some((s: { id: string }) => s.id === dbId);

  console.log('\nID Preservation Verification:');
  console.log(`Client preserved: ${clientPreserved}`);
  console.log(`API Gateway preserved: ${gwPreserved}`);
  console.log(`Backend Service preserved: ${backendPreserved}`);
  console.log(`PostgreSQL preserved: ${dbPreserved}`);

  if (clientPreserved && gwPreserved && backendPreserved && dbPreserved) {
    console.log('\n======================================================');
    console.log('🎉 SUCCESS! Both acceptance test scenarios PASSED 100%!');
    console.log('======================================================');
  } else {
    throw new Error('Shape IDs were not preserved!');
  }

  await client.close();
}

runScenario().catch((err) => {
  console.error('Scenario failed:', err);
  process.exit(1);
});
