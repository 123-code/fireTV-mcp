#!/bin/bash

echo "🔥 Testing Enhanced Fire TV MCP Server"
echo "======================================"

echo -e "\n🎬 Testing YouTube Search..."
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"firetv_control","arguments":{"command":"youtube_search","value":"funny cat videos"}}}' | node src/index.js 2>/dev/null | head -n 1

echo -e "\n▶️ Testing YouTube Play..."
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"firetv_control","arguments":{"command":"youtube_play","value":"cooking tutorial"}}}' | node src/index.js 2>/dev/null | head -n 1

echo -e "\n📺 Testing Netflix Continue..."
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"firetv_control","arguments":{"command":"netflix_continue"}}}' | node src/index.js 2>/dev/null | head -n 1

echo -e "\n🔍 Testing Netflix Search..."
echo '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"firetv_control","arguments":{"command":"netflix_search","value":"stranger things"}}}' | node src/index.js 2>/dev/null | head -n 1

echo -e "\n🎉 Advanced features test completed!"
echo -e "\n💡 New capabilities:"
echo "   🎬 YouTube: Search and auto-play videos"
echo "   📺 Netflix: Continue watching and search"
echo "   🤖 AI Integration: Perfect for voice commands!"

echo -e "\n🗣️ Try saying to Claude:"
echo '   "Search for cooking videos on YouTube"'
echo '   "Play my last Netflix show"'
echo '   "Find Stranger Things on Netflix"' 