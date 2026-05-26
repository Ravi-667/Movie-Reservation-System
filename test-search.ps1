# Helper function for authenticated headers
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$email = "admin$timestamp@example.com"
$authBody = @{ email = $email; password = "password"; name = "Admin"; role = "ADMIN" } | ConvertTo-Json
$reg = Invoke-RestMethod -Uri "http://localhost:3000/auth/register" -Method Post -Body $authBody -ContentType "application/json"
$login = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method Post -Body (@{email = $email; password = "password" } | ConvertTo-Json) -ContentType "application/json"
$token = $login.token
$headers = @{ Authorization = "Bearer $token" }

# 1. Create specific movies for test
Write-Host "Creating 'Superbad' (Comedy)..."
Invoke-RestMethod -Uri "http://localhost:3000/api/movies" -Method Post -Headers $headers -ContentType "application/json" -Body (@{
        title = "Superbad"; durationMin = 113; releaseDate = "2007-08-17"; genre = "Comedy"
    } | ConvertTo-Json) | Out-Null

Write-Host "Creating 'Inception 2' (Sci-Fi)..."
Invoke-RestMethod -Uri "http://localhost:3000/api/movies" -Method Post -Headers $headers -ContentType "application/json" -Body (@{
        title = "Inception 2"; durationMin = 148; releaseDate = "2025-07-16"; genre = "Sci-Fi"
    } | ConvertTo-Json) | Out-Null

# 2. Test Search by Title
Write-Host "`nSearch 'Super':"
$res = Invoke-RestMethod -Uri "http://localhost:3000/api/movies?search=Super" -Method Get
Write-Host "Found: $($res.length) movies"
$res | ForEach-Object { Write-Host "- $($_.title)" }

if ($res.length -eq 0) { Write-Host "FAIL: Should have found Superbad" }

# 3. Test Filter by Genre
Write-Host "`nFilter Genre 'Sci-Fi':"
$res = Invoke-RestMethod -Uri "http://localhost:3000/api/movies?genre=Sci-Fi" -Method Get
Write-Host "Found: $($res.length) movies"
$res | ForEach-Object { Write-Host "- $($_.title) ($($_.genre))" }

# 4. Test Filter by Date
Write-Host "`nFilter Date > 2020:"
$res = Invoke-RestMethod -Uri "http://localhost:3000/api/movies?startDate=2020-01-01" -Method Get
Write-Host "Found: $($res.length) movies"
$res | ForEach-Object { Write-Host "- $($_.title) ($($_.releaseDate))" }
