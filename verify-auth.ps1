$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$email = "admin$timestamp@example.com"
$password = "securepassword"

Write-Host "1. Registering new Admin user: $email..."
$registerBody = @{
    email = $email
    password = $password
    name = "Admin User"
    role = "ADMIN"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:3000/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "Registered: $($registerResponse.message)"
} catch {
    Write-Host "Registration failed: $_"
    exit 1
}

Write-Host "`n2. Logging in..."
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Login Successful. Token received."
} catch {
    Write-Host "Login failed: $_"
    exit 1
}

Write-Host "`n3. Attempting to create movie WITHOUT token (Should fail)..."
$movieBody = @{
    title = "Unauthorized Movie"
    durationMin = 120
    releaseDate = "2026-01-01"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/movies" -Method Post -Body $movieBody -ContentType "application/json"
    Write-Host "ERROR: Unauthorized request succeeded unexpectedly!"
} catch {
    Write-Host "Success: Unauthorized request failed as expected. Error: $($_.Exception.Message)"
}

Write-Host "`n4. Attempting to create movie WITH token (Should succeed)..."
$authHeader = @{
    Authorization = "Bearer $token"
}
$validMovieBody = @{
    title = "Authorized Admin Movie $timestamp"
    description = "Created securely"
    durationMin = 120
    releaseDate = "2026-01-01"
    genre = "Thriller"
} | ConvertTo-Json

try {
    $movieResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/movies" -Method Post -Body $validMovieBody -Headers $authHeader -ContentType "application/json"
    Write-Host "Movie Created: $($movieResponse.title)"
} catch {
    Write-Host "Authorized request failed: $_"
    exit 1
}
