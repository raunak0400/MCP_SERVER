Param(
  [int]$Port = 4000
)

Write-Host "Starting auxiliary server on port $Port"
node ./dist/server/index.js --port $Port
