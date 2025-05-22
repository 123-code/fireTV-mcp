#!/bin/bash

echo "🔥 Testing Fire TV MCP Server"
echo "============================="

# Test 1: List tools
echo -e "\n1️⃣ Testing: List available tools..."
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node src/index.js | head -n 1

# Test 2: Check status  
echo -e "\n2️⃣ Testing: Check Fire TV status..."
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"firetv_status","arguments":{}}}' | node src/index.js | head -n 1

# Test 3: Try Fire TV control (home)
echo -e "\n3️⃣ Testing: Fire TV control (home screen)..."
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"firetv_control","arguments":{"command":"home"}}}' | node src/index.js | head -n 1

echo -e "\n🎉 Test completed!"
echo -e "\n💡 If you see JSON responses above, the MCP server is working!"
echo -e "\n🔧 To use with an AI assistant:"
echo "   1. Configure your MCP client to use this server"
echo "   2. Make sure your Fire TV has ADB debugging enabled"
echo "   3. Try commands like: firetv_control(command=\"open_netflix\")" 