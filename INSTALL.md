# MCP Server - Setup & Installation

## Prerequisites

### Install Node.js

Your project requires **Node.js 20+** to run. You have two options:

#### Option 1: Direct Installation (Recommended for Windows)
1. Download Node.js LTS from: https://nodejs.org/
2. Run the installer (choose version 20.x or higher)
3. Restart your terminal/PowerShell after installation

#### Option 2: Using NVM (Node Version Manager)
```powershell
# Install nvm-windows from: https://github.com/coreybutler/nvm-windows/releases
# Then:
nvm install 20
nvm use 20
```

### Verify Installation
```powershell
node --version  # Should show v20.x.x or higher
npm --version   # Should show 9.x.x or higher
```

## Installation Steps

### 1. Install Dependencies
```powershell
cd C:\Users\rauna\OneDrive\Desktop\hacktoberfest\MCP_SERVER
npm install
```

This will install all required packages:
- express, helmet, winston, ws, zod, dotenv (runtime)
- typescript, ts-node, ts-node-dev, @types/* (development)

### 2. Configure Environment
```powershell
# Copy example environment file
copy .env.example .env

# Edit .env with your settings (optional)
notepad .env
```

### 3. Build the Project
```powershell
# TypeScript compilation
npm run build

# Or watch mode for development
npm run build:watch
```

### 4. Build Native Plugins (Optional)
If you want to use C/C++ plugins, you need a C++ compiler:

**Option A: Visual Studio Build Tools (Recommended for Windows)**
- Download from: https://visualstudio.microsoft.com/downloads/
- Install "Desktop development with C++"
- Restart terminal

**Option B: MinGW-w64**
- Download from: https://www.mingw-w64.org/
- Add to PATH: `C:\mingw64\bin`

Then build plugins:
```powershell
npm run build:plugins:win
# or manually:
.\scripts\build-plugins.bat
```

## Running the Server

### Development Mode (Hot Reload)
```powershell
npm run dev
```

### Production Mode
```powershell
npm run build
npm start
```

### Debug Mode
```powershell
npm run dev:debug
```

## Verify Installation

### Check Server Health
```powershell
# In another terminal after starting the server
npm run check:health
```

### Test Metrics Endpoint
```powershell
npm run metrics:dump
```

### Test WebSocket
```powershell
npm run ws:send -- --message="hello"
```

### Test Plugin Execution
```powershell
npm run plugin:run -- --plugin=sample --action=time
```

## Troubleshooting

### "npm is not recognized"
- Node.js is not installed or not in PATH
- Solution: Install Node.js from nodejs.org and restart terminal

### TypeScript Errors After Install
```powershell
# Clear cache and reinstall
rm -r node_modules
rm package-lock.json
npm install
```

### Port Already in Use
```powershell
# Change PORT in .env file
echo PORT=3001 >> .env
```

### Build Errors
```powershell
# Type check without building
npm run typecheck

# Clean build
rm -r dist
npm run build
```

### Plugin Compilation Fails
- Ensure you have a C++ compiler installed
- Check build output for specific errors
- Python plugins don't need compilation

## Project Structure
```
MCP_SERVER/
├── src/               # TypeScript source code
│   ├── server.ts      # Main entry point
│   ├── config/        # Configuration
│   ├── core/          # Core MCP logic
│   ├── routes/        # HTTP routes
│   ├── middleware/    # Express middleware
│   ├── services/      # Business logic
│   ├── plugins/       # Internal & external plugins
│   ├── utils/         # Utilities (logger, metrics)
│   ├── cache/         # Redis integration
│   └── llm/           # LLM integration
├── websocket/         # WebSocket module
├── scripts/           # Utility scripts
├── docs/              # Documentation
├── test/              # Tests (TODO)
└── dist/              # Compiled output (after build)
```

## Development Workflow

1. **Make Changes**: Edit files in `src/`
2. **Auto Reload**: `npm run dev` watches for changes
3. **Type Check**: `npm run typecheck` validates TypeScript
4. **Build**: `npm run build` compiles to `dist/`
5. **Test**: Run scripts to verify functionality
6. **Commit**: Use conventional commits (see CONTRIBUTING.md)

## Next Steps

- [ ] Install Node.js and npm
- [ ] Run `npm install`
- [ ] Configure `.env` file
- [ ] Build the project
- [ ] Start the development server
- [ ] Test all endpoints
- [ ] Review documentation in `docs/`

## Support

- GitHub Issues: https://github.com/raunak0400/MCP_SERVER/issues
- See SUPPORT.md for more help
- See CONTRIBUTING.md to contribute

## License

MIT - See LICENSE file
