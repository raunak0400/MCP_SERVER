Param(
  [string]$Url = 'http://localhost:4000/server/health'
)

try {
  $r = Invoke-RestMethod -Uri $Url -Method Get -ErrorAction Stop
  Write-Host "Health OK:`n" ($r | ConvertTo-Json -Depth 3)
  exit 0
} catch {
  Write-Host "Health check failed:`n" $_.Exception.Message
  exit 1
}
