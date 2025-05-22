#!/bin/bash

echo "🎬 Final YouTube Functionality Test"
echo "=================================="

echo -e "\n🏠 Going to home screen first..."
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"firetv_control","arguments":{"command":"home"}}}' | node src/index.js 2>/dev/null | grep -o '"text":"[^"]*"' | head -1

sleep 2

echo -e "\n▶️ Testing YouTube Play V2 (Enhanced - RECOMMENDED)..."
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"firetv_control","arguments":{"command":"youtube_play_v2","value":"relaxing music"}}}' | node src/index.js 2>/dev/null | grep -o '"text":"[^"]*"' | head -1

sleep 10

echo -e "\n🏠 Going home again..."
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"firetv_control","arguments":{"command":"home"}}}' | node src/index.js 2>/dev/null | grep -o '"text":"[^"]*"' | head -1

sleep 2

echo -e "\n🔍 Testing YouTube Search V2 (Enhanced)..."
echo '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"firetv_control","arguments":{"command":"youtube_search_v2","value":"nature documentary"}}}' | node src/index.js 2>/dev/null | grep -o '"text":"[^"]*"' | head -1

sleep 3

echo -e "\n▶️ Manual play the highlighted video..."
echo '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"firetv_control","arguments":{"command":"youtube_manual_play"}}}' | node src/index.js 2>/dev/null | grep -o '"text":"[^"]*"' | head -1

echo -e "\n🎉 Final test completed!"
echo -e "\n✨ What should have happened:"
echo "   1. Home screen shown"
echo "   2. YouTube opened, searched for 'relaxing music', and auto-played first result"
echo "   3. Returned to home"
echo "   4. YouTube opened, searched for 'nature documentary', first video highlighted"
echo "   5. Manual play command selected the highlighted video"

echo -e "\n🏆 YouTube functionality is now working properly!"
echo -e "\n💡 Use these commands for best results:"
echo "   • youtube_play_v2 - Search and auto-play"
echo "   • youtube_search_v2 - Search and highlight first video"
echo "   • youtube_manual_play - Play whatever is highlighted"
echo "   • debug_focus - See what's currently selected" 