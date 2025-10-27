# Files to Delete - Recommendations

## ⚠️ IMPORTANT: Create a Backup First!

Before deleting any files, create a backup:
```bash
# On Windows PowerShell
Copy-Item -Path "c:\Users\rauna\OneDrive\Desktop\Hacktoberfest\MCP_SERVER" `
  -Destination "c:\Users\rauna\OneDrive\Desktop\Hacktoberfest\MCP_SERVER_BACKUP" `
  -Recurse
```

---

## 🗑️ Safe to Delete (Duplicate/Unused Files)

### 1. server/ Folder (DUPLICATE)
**Location**: `./server/`  
**Reason**: Duplicate server implementation. Main implementation is in `./src/`  
**Impact**: None - not used by main application  

**Files in this folder**:
- server/index.ts
- server/config.ts
- server/logger.ts
- server/metrics.ts
- server/routes.ts
- server/routes_extra.ts
- server/ws.ts
- server/health-check.ps1
- server/health.html
- server/Makefile
- server/start.ps1
- server/tsconfig.json
- server/dockerfile
- server/.env.example
- server/.github/
- server/.dockerignore
- server/core/
- server/README.md

**Command to delete**:
```powershell
Remove-Item -Path ".\server" -Recurse -Force
```

### 2. websocket/ Folder (ADVANCED/UNUSED)
**Location**: `./websocket/`  
**Reason**: Advanced WebSocket implementation not currently integrated  
**Impact**: None - simpler implementation in `src/handlers/wsHandler.ts` is used  
**Note**: Keep if planning to use advanced features in future  

**Files in this folder**:
- websocket/client.ts
- websocket/connectionManager.ts
- websocket/index.ts
- websocket/messageHandler.ts
- websocket/service.ts
- websocket/types.ts

**Command to delete** (if not needed):
```powershell
Remove-Item -Path ".\websocket" -Recurse -Force
```

### 3. Unused Script Files
**Location**: `./scripts/`  
**Reason**: Some scripts may not be integrated  

Check these files:
- `scripts/process.py` - Python process management (not integrated)
- `scripts/setup.py` - Python setup script (not integrated)

**Command to delete** (if confirmed unused):
```powershell
Remove-Item -Path ".\scripts\process.py" -Force
Remove-Item -Path ".\scripts\setup.py" -Force
```

---

## ✅ Keep These Files (IMPORTANT)

### Core Application
```
✅ src/                    # Main application code
✅ dist/                   # Build output
✅ node_modules/           # Dependencies
✅ package.json            # Dependency manifest
✅ package-lock.json       # Locked dependencies
✅ tsconfig.json           # TypeScript config
```

### Configuration
```
✅ .env                    # Environment variables
✅ .env.example            # Example config
✅ .gitignore              # Git ignore rules
✅ .dockerignore           # Docker ignore rules
```

### Docker & Deployment
```
✅ Dockerfile              # Docker build
✅ docker-compose.yml      # Docker orchestration
✅ nginx.conf              # Reverse proxy config
✅ redis.conf              # Redis config
✅ deploy.yaml             # Kubernetes deployment
✅ service.yaml            # Kubernetes service
✅ vercel.json             # Vercel deployment
```

### Documentation
```
✅ README.md               # Main documentation
✅ PRODUCTION.md           # Production guide (NEW)
✅ PROJECT_CLEANUP_SUMMARY.md  # Cleanup summary (NEW)
✅ QUICK_REFERENCE.md      # Quick reference (NEW)
✅ CHANGELOG.md            # Version history
✅ CONTRIBUTING.md         # Contribution guide
✅ CONTRIBUTORS.md         # Contributors list
✅ CODE_OF_CONDUCT.md      # Code of conduct
✅ COMMIT_MESSAGE.md       # Commit guidelines
✅ ERROR_RESOLUTION.md     # Error guide
✅ INSTALL.md              # Install instructions
✅ SECURITY.md             # Security policy
✅ SETUP_FIRST.md          # Setup guide
✅ SUPPORT.md              # Support info
✅ LICENSE                 # License file
```

### Scripts
```
✅ scripts/build-plugins.bat    # Plugin build (Windows)
✅ scripts/build-plugins.sh     # Plugin build (Linux)
✅ scripts/health-check.ts      # Health check script
✅ scripts/metrics-dump.ts      # Metrics dump
✅ scripts/run-plugin.ts        # Plugin runner
✅ scripts/ws-send.ts           # WebSocket test
✅ setup.bat                    # Setup script
```

### Documentation Folder
```
✅ docs/PLUGIN_GUIDE.md    # Plugin development guide
```

---

## 🔍 Files to Review

### Check if These are Needed:

1. **registry.py**
   - Location: `./registry.py`
   - Check if it's used by external plugins
   - Delete if not integrated

2. **Duplicate deployment configs**
   - Check if `deploy.yaml` and `service.yaml` have duplicates
   - Consolidate if needed

3. **Multiple .env.example files**
   - `/.env.example` (KEEP)
   - `/server/.env.example` (DELETE with server folder)

---

## 📋 Recommended Cleanup Commands

### Option 1: Delete server/ folder only (Recommended)
```powershell
cd c:\Users\rauna\OneDrive\Desktop\Hacktoberfest\MCP_SERVER
Remove-Item -Path ".\server" -Recurse -Force
Write-Host "server/ folder deleted" -ForegroundColor Green
```

### Option 2: Full cleanup (server/ + websocket/)
```powershell
cd c:\Users\rauna\OneDrive\Desktop\Hacktoberfest\MCP_SERVER

# Delete server folder
Remove-Item -Path ".\server" -Recurse -Force

# Delete websocket folder
Remove-Item -Path ".\websocket" -Recurse -Force

# Delete unused Python scripts
Remove-Item -Path ".\scripts\process.py" -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".\scripts\setup.py" -Force -ErrorAction SilentlyContinue

Write-Host "Cleanup complete!" -ForegroundColor Green
```

### Option 3: Review before delete
```powershell
# List contents of server/ folder
Get-ChildItem -Path ".\server" -Recurse

# List contents of websocket/ folder
Get-ChildItem -Path ".\websocket" -Recurse

# Check file sizes
$serverSize = (Get-ChildItem -Path ".\server" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
$wsSize = (Get-ChildItem -Path ".\websocket" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB

Write-Host "server/ folder: $($serverSize.ToString('0.00')) MB"
Write-Host "websocket/ folder: $($wsSize.ToString('0.00')) MB"
```

---

## ✅ Verification After Cleanup

After deleting files, verify the application still works:

```powershell
# Clean build
Remove-Item -Path ".\dist" -Recurse -Force -ErrorAction SilentlyContinue
npm run build

# Start server
npm start

# In another terminal, test health
Start-Sleep -Seconds 3
Invoke-WebRequest http://localhost:3000/health
```

---

## 🎯 Summary of Recommendations

### Delete Immediately:
- ✅ **server/** folder - Duplicate implementation

### Consider Deleting:
- ⚠️ **websocket/** folder - If not planning advanced features
- ⚠️ **scripts/process.py** - If not integrated
- ⚠️ **scripts/setup.py** - If not integrated

### Keep Everything Else:
- ✅ All files in **src/**
- ✅ All documentation
- ✅ All configuration files
- ✅ Docker and deployment files

---

## 💾 Backup Strategy

Before making changes:

```powershell
# Create backup with timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = "c:\Users\rauna\OneDrive\Desktop\Hacktoberfest\MCP_SERVER_BACKUP_$timestamp"

Copy-Item -Path "c:\Users\rauna\OneDrive\Desktop\Hacktoberfest\MCP_SERVER" `
  -Destination $backupPath `
  -Recurse

Write-Host "Backup created at: $backupPath" -ForegroundColor Green
```

---

## 🚀 Final Command (Recommended Safe Cleanup)

```powershell
# Navigate to project
cd c:\Users\rauna\OneDrive\Desktop\Hacktoberfest\MCP_SERVER

# Create backup first
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item -Path "." -Destination "..\MCP_SERVER_BACKUP_$timestamp" -Recurse

# Delete server/ folder (duplicate)
Remove-Item -Path ".\server" -Recurse -Force

# Rebuild to verify
npm run build

# Test
npm start

Write-Host "✅ Cleanup complete! Server folder removed." -ForegroundColor Green
Write-Host "⚠️  Backup saved at: ..\MCP_SERVER_BACKUP_$timestamp" -ForegroundColor Yellow
```

---

**Remember**: You can always restore from backup if needed!
