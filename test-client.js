#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

async function testFireTVMCP() {
  console.log('🔥 Testing Fire TV MCP Server\n');

  // Start the MCP server
  const serverProcess = spawn('node', ['src/index.js'], {
    stdio: ['pipe', 'pipe', 'inherit']
  });

  // Create client
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['src/index.js']
  });
  
  const client = new Client(
    {
      name: 'firetv-test-client',
      version: '1.0.0',
    },
    {
      capabilities: {}
    }
  );

  try {
    // Connect to server
    await client.connect(transport);
    console.log('✅ Connected to Fire TV MCP Server\n');

    // List available tools
    const tools = await client.listTools();
    console.log('🛠️ Available tools:');
    tools.tools.forEach(tool => {
      console.log(`  • ${tool.name}: ${tool.description}`);
    });
    console.log('');

    // Test 1: Check status
    console.log('1️⃣ Checking Fire TV status...');
    const statusResult = await client.callTool({
      name: 'firetv_status',
      arguments: {}
    });
    console.log(statusResult.content[0].text);
    console.log('');

    // Test 2: List apps
    console.log('2️⃣ Getting available apps...');
    const appsResult = await client.callTool({
      name: 'firetv_apps',
      arguments: {}
    });
    console.log(appsResult.content[0].text);
    console.log('');

    // Test 3: Try a simple command (home)
    console.log('3️⃣ Testing Fire TV control (going to home screen)...');
    const controlResult = await client.callTool({
      name: 'firetv_control',
      arguments: {
        command: 'home'
      }
    });
    console.log(controlResult.content[0].text);
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('\n💡 Try these commands:');
    console.log('  • Open Netflix: firetv_control(command="open_netflix")');
    console.log('  • Navigate: firetv_control(command="up")');
    console.log('  • Search: firetv_control(command="search", value="funny cats")');
    console.log('  • Volume: firetv_control(command="volume_up")');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Clean up
    await client.close();
    serverProcess.kill();
  }
}

// Run the test
testFireTVMCP().catch(console.error);