# One-Click Cloudflare Pages Deployment Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Deploying Movie Booking to Cloudflare " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Build Production Bundle
Write-Host "`n[1/3] Building production bundle with Vite..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed! Please check errors above." -ForegroundColor Red
    exit 1
}

# 2. Deploy to Cloudflare Pages
Write-Host "`n[2/3] Deploying 'dist' directory to Cloudflare Pages..." -ForegroundColor Yellow
npx wrangler pages deploy dist --project-name=movie-booking-app

# 3. Done
if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[3/3] Deployment complete! Your app is live on Cloudflare Pages." -ForegroundColor Green
} else {
    Write-Host "`nDeployment error. Please ensure you are logged in via 'npx wrangler login' or provide CLOUDFLARE_API_TOKEN." -ForegroundColor Red
}
