# 🔥 Local Fire TV MCP Server

A **Model Context Protocol (MCP) server** that provides **real Fire TV control** through ADB commands. This server runs locally on your machine and can actually control your Fire TV device!

## 🎯 What This Does

- **Real Fire TV Control**: Execute actual ADB commands to control your Fire TV
- **MCP Protocol**: Proper MCP server implementation for integration with AI assistants
- **Local Execution**: Runs on your machine with full system access
- **Comprehensive Control**: Navigation, apps, volume, search, and more

## 🛠️ Prerequisites

1. **ADB (Android Debug Bridge)**:
   ```bash
   brew install android-platform-tools  # macOS
   ```

2. **Fire TV Setup**:
   - Settings → My Fire TV → About → Click Fire TV name 7 times (enables Developer Options)
   - Settings → My Fire TV → Developer Options → Turn ON "ADB debugging"
   - Settings → My Fire TV → Developer Options → Turn ON "Apps from Unknown Sources"

3. **Node.js**: Version 18+ required

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the MCP server**:
   ```bash
   npm start
   ```

3. **Test the server** (in another terminal):
   ```bash
   # Simple test
   echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node src/index.js
   ```

## 🎮 Available Tools

### `firetv_control`
Control Fire TV with these commands:

- **Navigation**: `home`, `back`, `up`, `down`, `left`, `right`, `select`, `menu`
- **Power**: `wake`, `sleep`
- **Volume**: `volume_up`, `volume_down`, `mute`
- **Media**: `play_pause`
- **Apps**: `open_youtube`, `open_netflix`, `open_prime`, `open_disney`, `open_hulu`
- **YouTube Advanced**: 
  - `youtube_search` (with value) - Search YouTube for specific content
  - `youtube_play` (with value) - Search and play first result automatically
- **Netflix Advanced**:
  - `netflix_continue` - Resume watching your last show
  - `netflix_search` (with value) - Search Netflix for specific content
- **Input**: `search` (with value), `type` (with value)
- **Info**: `get_current_app`, `list_apps`, `screenshot`

### `firetv_status`
Check Fire TV connection status and ADB availability.

### `firetv_connect`
Connect to Fire TV via ADB (optionally specify IP address).

### `firetv_apps`
List available Fire TV apps and their package names.

## 📱 Example Usage

### In Claude/MCP Client:

```
firetv_control(command="open_netflix")
firetv_control(command="youtube_search", value="funny cat videos")
firetv_control(command="youtube_play", value="cooking tutorial")
firetv_control(command="netflix_continue")
firetv_control(command="netflix_search", value="stranger things")
firetv_control(command="volume_up")
firetv_status()
```

### Direct MCP Calls:

```bash
# Open Netflix
echo '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "firetv_control",
    "arguments": {"command": "open_netflix"}
  }
}' | node src/index.js

# Go to home screen
echo '{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "firetv_control",
    "arguments": {"command": "home"}
  }
}' | node src/index.js
```

## 🔧 Configuration

The server is configured for Fire TV at IP `192.168.1.54`. To change this, modify the `fireTVIP` property in `src/index.js` or use the `firetv_connect` tool with a different IP.

## 🎉 Real vs Simulated

**This is the REAL DEAL!** Unlike cloud-based solutions that can only simulate commands, this local MCP server:

- ✅ **Actually executes ADB commands**
- ✅ **Really controls your Fire TV**  
- ✅ **Opens apps, navigates, changes volume**
- ✅ **Works with any MCP-compatible client**

## 🐛 Troubleshooting

### "ADB not available"
```bash
brew install android-platform-tools
adb version  # Should show version info
```

### "Cannot connect to Fire TV"
1. Enable Developer Options (click Fire TV name 7 times in About)
2. Turn ON "ADB debugging" in Developer Options
3. Check Fire TV is on same network
4. Try: `adb connect 192.168.1.54:5555`

### "Authentication failed"
- You should see a permission popup on Fire TV
- Select "Always allow from this computer"
- Restart Fire TV if needed

## 🔌 Integration

### With Claude Desktop
Add to your MCP configuration:
```json
{
  "mcpServers": {
    "firetv": {
      "command": "node",
      "args": ["/path/to/local-firetv-mcp/src/index.js"],
      "env": {}
    }
  }
}
```

### With Other MCP Clients
Use the stdio transport to connect to the server at `src/index.js`.
