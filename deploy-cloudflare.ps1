# One-Click Cloudflare Pages Deployment Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Deploying Movie Booking to Cloudflare " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Load .env variables into environment
if (Test-Path "$PSScriptRoot\.env") {
    Get-Content "$PSScriptRoot\.env" | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $parts = $line -split "=", 2
            if ($parts.Length -eq 2) {
                [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), "Process")
            }
        }
    }
}

# 1. Build Production Bundle
Write-Host "`n[1/3] Building production bundle with Vite..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed! Please check errors above." -ForegroundColor Red
    exit 1
}

# 2. Deploy to Cloudflare Pages
Write-Host "`n[2/3] Deploying 'dist' directory to Cloudflare Pages..." -ForegroundColor Yellow
npx wrangler pages deploy dist --project-name=movie-booking-app --commit-dirty=true

# 3. Done
if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[3/3] Deployment complete! Your app is live on Cloudflare Pages." -ForegroundColor Green
} else {
    Write-Host "`nDeployment error. Please verify token permissions." -ForegroundColor Red
}
