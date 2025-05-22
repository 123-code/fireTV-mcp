#!/bin/bash

echo "🎬 Testing Enhanced YouTube Functionality"
echo "========================================"

echo -e "\n1️⃣ Testing improved YouTube search..."
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"firetv_control","arguments":{"command":"youtube_search","value":"funny cats"}}}' | node src/index.js 2>/dev/null | tail -n 1

sleep 3

echo -e "\n2️⃣ Checking what's currently focused..."
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"firetv_control","arguments":{"command":"debug_focus"}}}' | node src/index.js 2>/dev/null | tail -n 1

echo -e "\n3️⃣ Manual play current selection..."
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"firetv_control","arguments":{"command":"youtube_manual_play"}}}' | node src/index.js 2>/dev/null | tail -n 1

sleep 5

echo -e "\n4️⃣ Testing full YouTube play sequence..."
echo '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"firetv_control","arguments":{"command":"youtube_play","value":"cooking tutorial"}}}' | node src/index.js 2>/dev/null | tail -n 1

echo -e "\n🎉 YouTube test completed!"
echo -e "\n💡 What should happen:"
echo "   1. YouTube opens and searches for 'funny cats'"
echo "   2. First video should be highlighted"
echo "   3. Manual play should start that video"
echo "   4. Full sequence should search and auto-play cooking tutorial"

echo -e "\n🔧 If videos aren't playing:"
echo "   • Try running the debug_focus command to see what's selected"
echo "   • Use youtube_manual_play after a search to play highlighted video"
echo "   • Check if search results are actually showing up" 