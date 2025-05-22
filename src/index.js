#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class FireTVMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'firetv-control-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.fireTVIP = '192.168.1.54';
    this.setupHandlers();
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'firetv_control',
            description: 'Control Fire TV using ADB commands. Can navigate, launch apps, control volume, and more.',
            inputSchema: {
              type: 'object',
              properties: {
                command: {
                  type: 'string',
                  description: 'The command to execute',
                  enum: [
                    'home', 'back', 'up', 'down', 'left', 'right', 'select', 'menu',
                    'wake', 'sleep', 'play_pause', 'volume_up', 'volume_down', 'mute',
                    'open_youtube', 'open_netflix', 'open_prime', 'open_disney', 'open_hulu',
                    'search', 'type', 'get_current_app', 'list_apps', 'screenshot',
                    'youtube_search', 'youtube_play', 'netflix_continue', 'netflix_search',
                    'debug_focus', 'youtube_manual_play', 'youtube_search_v2', 'youtube_play_v2'
                  ]
                },
                value: {
                  type: 'string',
                  description: 'Optional value for commands like search or type',
                  optional: true
                }
              },
              required: ['command']
            }
          },
          {
            name: 'firetv_status',
            description: 'Check Fire TV connection status and ADB availability',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'firetv_connect',
            description: 'Connect to Fire TV via ADB',
            inputSchema: {
              type: 'object',
              properties: {
                ip: {
                  type: 'string',
                  description: 'Fire TV IP address (default: 192.168.1.54)',
                  optional: true
                }
              },
              required: []
            }
          },
          {
            name: 'firetv_apps',
            description: 'Get information about available Fire TV apps and their package names',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'firetv_control':
            return await this.handleFireTVControl(args.command, args.value);
          
          case 'firetv_status':
            return await this.handleFireTVStatus();
          
          case 'firetv_connect':
            return await this.handleFireTVConnect(args.ip);
          
          case 'firetv_apps':
            return await this.handleFireTVApps();
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing ${name}: ${error.message}`
        );
      }
    });
  }

  async checkADB() {
    try {
      await execAsync('adb version');
      return true;
    } catch {
      return false;
    }
  }

  async connectFireTV(ip = this.fireTVIP) {
    try {
      const { stdout } = await execAsync(`adb connect ${ip}:5555`);
      return { success: true, output: stdout.trim() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async executeADBCommand(command) {
    const fullCommand = `adb -s ${this.fireTVIP}:5555 shell ${command}`;
    console.log(`🔥 Executing: ${fullCommand}`);
    
    try {
      const { stdout, stderr } = await execAsync(fullCommand);
      return { success: true, stdout: stdout.trim(), stderr: stderr.trim() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getFireTVAppPackages() {
    return {
      'youtube': 'com.amazon.firetv.youtube',
      'netflix': 'com.netflix.ninja',
      'prime': 'com.amazon.avod',
      'prime video': 'com.amazon.avod',
      'disney': 'com.disney.disneyplus',
      'disney+': 'com.disney.disneyplus',
      'hulu': 'com.hulu.plus',
      'spotify': 'com.spotify.tv.android',
      'twitch': 'tv.twitch.android.app',
      'hbo': 'com.hbo.hbonow',
      'hbo max': 'com.hbo.hbonow',
      'apple tv': 'com.apple.atve.amazon.appletv',
      'peacock': 'com.peacocktv.peacockandroid',
      'paramount': 'com.cbs.ca',
      'pluto': 'tv.pluto.android',
      'tubi': 'com.tubitv',
      'crackle': 'com.gotv.crackle.handset',
      'imdb': 'com.imdb.mobile',
      'browser': 'com.amazon.cloud9',
      'silk': 'com.amazon.cloud9'
    };
  }

  async handleFireTVControl(command, value) {
    // Check ADB availability
    const adbAvailable = await this.checkADB();
    if (!adbAvailable) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ ADB not available. Please install Android Debug Bridge: brew install android-platform-tools'
          }
        ]
      };
    }

    // Connect to Fire TV
    const connection = await this.connectFireTV();
    if (!connection.success) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Cannot connect to Fire TV at ${this.fireTVIP}:5555\n\n🔧 To enable ADB debugging:\n1. Go to Settings > My Fire TV > Developer Options\n2. Turn ON "ADB debugging"\n3. Turn ON "Apps from Unknown Sources"\n\nError: ${connection.error}`
          }
        ]
      };
    }

    // Map command to ADB command
    let adbCommand;
    let description;

    switch (command.toLowerCase()) {
      case 'home':
        adbCommand = 'input keyevent KEYCODE_HOME';
        description = 'Going to home screen';
        break;
      case 'back':
        adbCommand = 'input keyevent KEYCODE_BACK';
        description = 'Pressing back button';
        break;
      case 'up':
        adbCommand = 'input keyevent KEYCODE_DPAD_UP';
        description = 'Navigating up';
        break;
      case 'down':
        adbCommand = 'input keyevent KEYCODE_DPAD_DOWN';
        description = 'Navigating down';
        break;
      case 'left':
        adbCommand = 'input keyevent KEYCODE_DPAD_LEFT';
        description = 'Navigating left';
        break;
      case 'right':
        adbCommand = 'input keyevent KEYCODE_DPAD_RIGHT';
        description = 'Navigating right';
        break;
      case 'select':
        adbCommand = 'input keyevent KEYCODE_DPAD_CENTER';
        description = 'Pressing select/enter';
        break;
      case 'menu':
        adbCommand = 'input keyevent KEYCODE_MENU';
        description = 'Opening menu';
        break;
      case 'wake':
        adbCommand = 'input keyevent KEYCODE_WAKEUP';
        description = 'Waking up Fire TV';
        break;
      case 'sleep':
        adbCommand = 'input keyevent KEYCODE_SLEEP';
        description = 'Putting Fire TV to sleep';
        break;
      case 'play_pause':
        adbCommand = 'input keyevent KEYCODE_MEDIA_PLAY_PAUSE';
        description = 'Toggle play/pause';
        break;
      case 'volume_up':
        adbCommand = 'input keyevent KEYCODE_VOLUME_UP';
        description = 'Volume up';
        break;
      case 'volume_down':
        adbCommand = 'input keyevent KEYCODE_VOLUME_DOWN';
        description = 'Volume down';
        break;
      case 'mute':
        adbCommand = 'input keyevent KEYCODE_VOLUME_MUTE';
        description = 'Toggle mute';
        break;
      case 'open_youtube':
        adbCommand = 'monkey -p com.amazon.firetv.youtube 1';
        description = 'Opening YouTube';
        break;
      case 'open_netflix':
        adbCommand = 'monkey -p com.netflix.ninja 1';
        description = 'Opening Netflix';
        break;
      case 'open_prime':
        adbCommand = 'monkey -p com.amazon.avod 1';
        description = 'Opening Prime Video';
        break;
      case 'open_disney':
        adbCommand = 'monkey -p com.disney.disneyplus 1';
        description = 'Opening Disney+';
        break;
      case 'open_hulu':
        adbCommand = 'monkey -p com.hulu.plus 1';
        description = 'Opening Hulu';
        break;
      case 'search':
        if (!value) {
          return {
            content: [
              {
                type: 'text',
                text: '❌ Search command requires a value (search query)'
              }
            ]
          };
        }
        // First open search
        await this.executeADBCommand('input keyevent KEYCODE_SEARCH');
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Then type the search query
        const escapedSearchText = value.replace(/'/g, "\\'").replace(/ /g, '%s');
        adbCommand = `input text "${escapedSearchText}"`;
        description = `Searching for: ${value}`;
        break;
      case 'type':
        if (!value) {
          return {
            content: [
              {
                type: 'text',
                text: '❌ Type command requires a value (text to type)'
              }
            ]
          };
        }
        const escapedText = value.replace(/'/g, "\\'").replace(/ /g, '%s');
        adbCommand = `input text "${escapedText}"`;
        description = `Typing: ${value}`;
        break;
      case 'get_current_app':
        adbCommand = 'dumpsys window windows | grep -E mCurrentFocus';
        description = 'Getting current app info';
        break;
      case 'list_apps':
        adbCommand = 'pm list packages';
        description = 'Listing installed apps';
        break;
      case 'screenshot':
        adbCommand = 'screencap -p /sdcard/screenshot.png';
        description = 'Taking screenshot';
        break;
      case 'youtube_search':
        if (!value) {
          return {
            content: [
              {
                type: 'text',
                text: '❌ YouTube search requires a value (search query)'
              }
            ]
          };
        }
        return await this.handleYouTubeSearch(value);
      case 'youtube_play':
        if (!value) {
          return {
            content: [
              {
                type: 'text',
                text: '❌ YouTube play requires a value (video title to search for)'
              }
            ]
          };
        }
        return await this.handleYouTubePlay(value);
      case 'netflix_continue':
        return await this.handleNetflixContinue();
      case 'netflix_search':
        if (!value) {
          return {
            content: [
              {
                type: 'text',
                text: '❌ Netflix search requires a value (search query)'
              }
            ]
          };
        }
        return await this.handleNetflixSearch(value);
      case 'debug_focus':
        return await this.handleDebugFocus();
      case 'youtube_manual_play':
        return await this.handleYouTubeManualPlay();
      case 'youtube_search_v2':
        if (!value) {
          return {
            content: [
              {
                type: 'text',
                text: '❌ YouTube search v2 requires a value (search query)'
              }
            ]
          };
        }
        return await this.handleYouTubeSearchV2(value);
      case 'youtube_play_v2':
        if (!value) {
          return {
            content: [
              {
                type: 'text',
                text: '❌ YouTube play v2 requires a value (video title to search for)'
              }
            ]
          };
        }
        return await this.handleYouTubePlayV2(value);
      default:
        return {
          content: [
            {
              type: 'text',
              text: `❌ Unknown command: ${command}\n\nAvailable commands:\n• Navigation: home, back, up, down, left, right, select, menu\n• Power: wake, sleep\n• Volume: volume_up, volume_down, mute, play_pause\n• Apps: open_youtube, open_netflix, open_prime, open_disney, open_hulu\n• YouTube: youtube_search_v2, youtube_play_v2 (recommended!)\n• YouTube Legacy: youtube_search, youtube_play\n• Netflix: netflix_continue, netflix_search\n• Debug: debug_focus, youtube_manual_play\n• General: search, type, get_current_app, list_apps, screenshot`
            }
          ]
        };
    }

    // Execute the command
    const result = await this.executeADBCommand(adbCommand);
    
    if (result.success) {
      return {
        content: [
          {
            type: 'text',
            text: `✅ ${description}\n📱 Command: ${adbCommand}\n🕐 Executed at: ${new Date().toLocaleTimeString()}\n📊 Output: ${result.stdout || 'Success'}`
          }
        ]
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to execute command: ${description}\n📱 Command: ${adbCommand}\n🚫 Error: ${result.error}`
          }
        ]
      };
    }
  }

  async handleFireTVStatus() {
    const adbAvailable = await this.checkADB();
    
    if (!adbAvailable) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ ADB not installed\n\n🔧 Install with: brew install android-platform-tools'
          }
        ]
      };
    }

    const connection = await this.connectFireTV();
    
    return {
      content: [
        {
          type: 'text',
          text: `🔥 Fire TV MCP Server Status\n\n✅ ADB: Available\n${connection.success ? '✅' : '❌'} Fire TV: ${connection.success ? 'Connected' : 'Not connected'}\n📱 IP Address: ${this.fireTVIP}\n🕐 Checked at: ${new Date().toLocaleTimeString()}\n\n${connection.success ? '' : `🔧 Connection error: ${connection.error}\n\nTo enable ADB debugging:\n1. Settings > My Fire TV > Developer Options\n2. Turn ON "ADB debugging"\n3. Turn ON "Apps from Unknown Sources"`}`
        }
      ]
    };
  }

  async handleFireTVConnect(ip) {
    if (ip) {
      this.fireTVIP = ip;
    }

    const adbAvailable = await this.checkADB();
    if (!adbAvailable) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ ADB not available. Please install Android Debug Bridge: brew install android-platform-tools'
          }
        ]
      };
    }

    const connection = await this.connectFireTV(this.fireTVIP);
    
    return {
      content: [
        {
          type: 'text',
          text: `🔗 Attempting to connect to Fire TV at ${this.fireTVIP}:5555\n\n${connection.success ? '✅ Successfully connected!' : `❌ Connection failed: ${connection.error}`}\n\n📊 Connection output: ${connection.output || connection.error}`
        }
      ]
    };
  }

  async handleFireTVApps() {
    const apps = this.getFireTVAppPackages();
    const appList = Object.entries(apps).map(([name, packageName]) => 
      `📱 ${name}: ${packageName}`
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `🔥 Fire TV Apps Available for Control\n\n${appList}\n\n💡 Use commands like:\n• firetv_control(command="open_netflix")\n• firetv_control(command="open_youtube")\n• firetv_control(command="open_prime")\n• firetv_control(command="youtube_search", value="funny cats")\n• firetv_control(command="netflix_continue")`
        }
      ]
    };
  }

  /**
   * Search for specific content on YouTube
   */
  async handleYouTubeSearch(query) {
    try {
      const steps = [
        { command: 'monkey -p com.amazon.firetv.youtube 1', description: 'Opening YouTube', delay: 4000 },
        { command: 'input keyevent KEYCODE_SEARCH', description: 'Opening search', delay: 2000 },
        { command: `input text "${query.replace(/'/g, "\\'").replace(/ /g, '%s')}"`, description: `Typing: ${query}`, delay: 1500 },
        { command: 'input keyevent KEYCODE_ENTER', description: 'Executing search', delay: 3000 },
        { command: 'input keyevent KEYCODE_DPAD_DOWN', description: 'Moving to search results', delay: 1000 },
        { command: 'input keyevent KEYCODE_DPAD_DOWN', description: 'Moving to first video', delay: 1000 }
      ];

      let results = [];
      for (const step of steps) {
        const result = await this.executeADBCommand(step.command);
        results.push(`${step.description}: ${result.success ? '✅' : '❌'}`);
        
        if (step.delay) {
          await new Promise(resolve => setTimeout(resolve, step.delay));
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `🎬 YouTube Search for "${query}"\n\n${results.join('\n')}\n\n✨ Search completed! First video should be highlighted. Press 'select' to play.`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to search YouTube: ${error.message}`
          }
        ]
      };
    }
  }

  /**
   * Search and play first result on YouTube
   */
  async handleYouTubePlay(query) {
    try {
      const steps = [
        { command: 'monkey -p com.amazon.firetv.youtube 1', description: 'Opening YouTube', delay: 4000 },
        { command: 'input keyevent KEYCODE_SEARCH', description: 'Opening search', delay: 2000 },
        { command: `input text "${query.replace(/'/g, "\\'").replace(/ /g, '%s')}"`, description: `Typing: ${query}`, delay: 1500 },
        { command: 'input keyevent KEYCODE_ENTER', description: 'Executing search', delay: 3000 },
        { command: 'input keyevent KEYCODE_DPAD_DOWN', description: 'Moving to search results', delay: 1000 },
        { command: 'input keyevent KEYCODE_DPAD_DOWN', description: 'Moving to first video', delay: 1000 },
        { command: 'input keyevent KEYCODE_DPAD_CENTER', description: 'Selecting and playing first video', delay: 2000 }
      ];

      let results = [];
      for (const step of steps) {
        const result = await this.executeADBCommand(step.command);
        results.push(`${step.description}: ${result.success ? '✅' : '❌'}`);
        
        if (step.delay) {
          await new Promise(resolve => setTimeout(resolve, step.delay));
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `▶️ YouTube Play "${query}"\n\n${results.join('\n')}\n\n🎉 First search result should be playing now!`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to play YouTube video: ${error.message}`
          }
        ]
      };
    }
  }

  /**
   * Continue watching last show on Netflix
   */
  async handleNetflixContinue() {
    try {
      const steps = [
        { command: 'monkey -p com.netflix.ninja 1', description: 'Opening Netflix', delay: 4000 },
        { command: 'input keyevent KEYCODE_DPAD_DOWN', description: 'Moving to Continue Watching', delay: 1000 },
        { command: 'input keyevent KEYCODE_DPAD_DOWN', description: 'Moving to Continue Watching row', delay: 1000 },
        { command: 'input keyevent KEYCODE_DPAD_CENTER', description: 'Selecting first show', delay: 1000 }
      ];

      let results = [];
      for (const step of steps) {
        const result = await this.executeADBCommand(step.command);
        results.push(`${step.description}: ${result.success ? '✅' : '❌'}`);
        
        if (step.delay) {
          await new Promise(resolve => setTimeout(resolve, step.delay));
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `📺 Netflix Continue Watching\n\n${results.join('\n')}\n\n🍿 Should be resuming your last show now!`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to continue Netflix show: ${error.message}`
          }
        ]
      };
    }
  }

  /**
   * Search for specific content on Netflix
   */
  async handleNetflixSearch(query) {
    try {
      const steps = [
        { command: 'monkey -p com.netflix.ninja 1', description: 'Opening Netflix', delay: 4000 },
        { command: 'input keyevent KEYCODE_SEARCH', description: 'Opening search', delay: 2000 },
        { command: `input text "${query.replace(/'/g, "\\'").replace(/ /g, '%s')}"`, description: `Typing: ${query}`, delay: 1000 },
        { command: 'input keyevent KEYCODE_DPAD_CENTER', description: 'Starting search', delay: 2000 }
      ];

      let results = [];
      for (const step of steps) {
        const result = await this.executeADBCommand(step.command);
        results.push(`${step.description}: ${result.success ? '✅' : '❌'}`);
        
        if (step.delay) {
          await new Promise(resolve => setTimeout(resolve, step.delay));
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `🔍 Netflix Search for "${query}"\n\n${results.join('\n')}\n\n✨ Search completed! You should see results on your TV.`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to search Netflix: ${error.message}`
          }
        ]
      };
    }
  }

  /**
   * Debug what's currently focused on screen
   */
  async handleDebugFocus() {
    try {
      const result = await this.executeADBCommand('dumpsys window windows | grep -E "mCurrentFocus|mFocusedApp"');
      
      return {
        content: [
          {
            type: 'text',
            text: `🔍 Debug Focus Information\n\n📱 Current Focus:\n${result.stdout || 'No focus info available'}\n\n💡 This helps debug which UI element is currently selected.`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to get focus info: ${error.message}`
          }
        ]
      };
    }
  }

  /**
   * Manual YouTube play - just selects whatever is currently highlighted
   */
  async handleYouTubeManualPlay() {
    try {
      const result = await this.executeADBCommand('input keyevent KEYCODE_DPAD_CENTER');
      
      return {
        content: [
          {
            type: 'text',
            text: `▶️ Manual Play Command\n\n${result.success ? '✅ Pressed select on current item' : '❌ Failed to press select'}\n\n💡 This selects whatever is currently highlighted on screen.`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to execute manual play: ${error.message}`
          }
        ]
      };
    }
  }

  /**
   * Enhanced YouTube search v2 with better navigation
   */
  async handleYouTubeSearchV2(query) {
    try {
      const steps = [
        { command: 'input keyevent KEYCODE_HOME', description: 'Going to home first', delay: 2000 },
        { command: 'monkey -p com.amazon.firetv.youtube 1', description: 'Opening YouTube', delay: 5000 },
        { command: 'input keyevent KEYCODE_DPAD_UP', description: 'Moving to top menu', delay: 1000 },
        { command: 'input keyevent KEYCODE_DPAD_RIGHT', description: 'Moving to search icon', delay: 1000 },
        { command: 'input keyevent KEYCODE_DPAD_RIGHT', description: 'Moving to search icon', delay: 1000 },
        { command: 'input keyevent KEYCODE_DPAD_CENTER', description: 'Opening search', delay: 2000 },
        { command: `input text "${query.replace(/'/g, "\\'").replace(/ /g, '%s')}"`, description: `Typing: ${query}`, delay: 1500 },
        { command: 'input keyevent KEYCODE_ENTER', description: 'Executing search', delay: 4000 },
        { command: 'input keyevent KEYCODE_DPAD_DOWN', description: 'Moving to results', delay: 1000 },
        { command: 'input keyevent KEYCODE_DPAD_CENTER', description: 'Selecting first video', delay: 1000 }
      ];

      let results = [];
      for (const step of steps) {
        const result = await this.executeADBCommand(step.command);
        results.push(`${step.description}: ${result.success ? '✅' : '❌'}`);
        
        if (step.delay) {
          await new Promise(resolve => setTimeout(resolve, step.delay));
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `🎬 YouTube Search V2 for "${query}"\n\n${results.join('\n')}\n\n✨ Enhanced search with better navigation completed!`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to search YouTube v2: ${error.message}`
          }
        ]
      };
    }
  }

  /**
   * Enhanced YouTube play v2 with automatic video selection
   */
  async handleYouTubePlayV2(query) {
    try {
      const steps = [
        { command: 'input keyevent KEYCODE_HOME', description: 'Going to home first', delay: 2000 },
        { command: 'monkey -p com.amazon.firetv.youtube 1', description: 'Opening YouTube', delay: 5000 },
        { command: 'input keyevent KEYCODE_DPAD_UP', description: 'Moving to top menu', delay: 1000 },
        { command: 'input keyevent KEYCODE_DPAD_RIGHT', description: 'Moving to search icon', delay: 1000 },
        { command: 'input keyevent KEYCODE_DPAD_RIGHT', description: 'Moving to search icon', delay: 1000 },
        { command: 'input keyevent KEYCODE_DPAD_CENTER', description: 'Opening search', delay: 2000 },
        { command: `input text "${query.replace(/'/g, "\\'").replace(/ /g, '%s')}"`, description: `Typing: ${query}`, delay: 1500 },
        { command: 'input keyevent KEYCODE_ENTER', description: 'Executing search', delay: 4000 },
        { command: 'input keyevent KEYCODE_DPAD_DOWN', description: 'Moving to results', delay: 1000 },
        { command: 'input keyevent KEYCODE_DPAD_CENTER', description: 'Selecting and playing first video', delay: 2000 }
      ];

      let results = [];
      for (const step of steps) {
        const result = await this.executeADBCommand(step.command);
        results.push(`${step.description}: ${result.success ? '✅' : '❌'}`);
        
        if (step.delay) {
          await new Promise(resolve => setTimeout(resolve, step.delay));
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `▶️ YouTube Play V2 "${query}"\n\n${results.join('\n')}\n\n🎉 Enhanced play sequence completed! Video should be playing now!`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to play YouTube video v2: ${error.message}`
          }
        ]
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🔥 Fire TV MCP Server running on stdio');
  }
}

const server = new FireTVMCPServer();
server.run().catch(console.error); 