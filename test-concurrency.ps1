$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$email = "res_user$timestamp@example.com"
$password = "securepassword"

# 1. Login/Register (Reusing Admin logic from previous checks for simplicity, or create new user)
Write-Host "1. Registering new User..."
$registerBody = @{
    email    = $email
    password = $password
    name     = "Reservation Tester"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/auth/register" -Method Post -Body $registerBody -ContentType "application/json" | Out-Null

Write-Host "2. Logging in..."
$loginBody = @{
    email    = $email
    password = $password
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token

$authHeader = @{
    Authorization = "Bearer $token"
}

# Assume Showtime ID 1 exists (from seed/previous tests)
$showtimeId = 1

Write-Host "`n3. Checking Availability (Before Booking)..."
$seats = Invoke-RestMethod -Uri "http://localhost:3000/api/reservations/showtime/$showtimeId" -Method Get
# Find Seat ID for Row A Number 1
$seatA1 = $seats | Where-Object { $_.row -eq "A" -and $_.number -eq 1 }
Write-Host "Seat A1 Status: $($seatA1.status)"

if ($seatA1.status -ne "AVAILABLE") {
    Write-Host "WARNING: Seat A1 is not available. Test might fail/be inconsistent."
}

Write-Host "`n4. Booking Seat A1..."
$bookBody = @{
    showtimeId = $showtimeId
    seatIds    = @($seatA1.id)
} | ConvertTo-Json

try {
    $bookResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/reservations" -Method Post -Body $bookBody -Headers $authHeader -ContentType "application/json"
    Write-Host "Booking Successful! Reservation ID: $($bookResponse.id)"
}
catch {
    Write-Host "Booking Failed: $_"
    exit 1
}

Write-Host "`n5. Checking Availability (After Booking)..."
$seatsAfter = Invoke-RestMethod -Uri "http://localhost:3000/api/reservations/showtime/$showtimeId" -Method Get
$seatA1After = $seatsAfter | Where-Object { $_.id -eq $seatA1.id }
Write-Host "Seat A1 Status: $($seatA1After.status)"

if ($seatA1After.status -ne "LOCKED") {
    Write-Host "ERROR: Seat status should be LOCKED"
}

Write-Host "`n6. Attempting Double Booking (Should Fail)..."
try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/reservations" -Method Post -Body $bookBody -Headers $authHeader -ContentType "application/json"
    Write-Host "ERROR: Double booking succeeded unexpectedly!"
}
catch {
    Write-Host "Success: Double booking failed. Error: $($_.Exception.Message)"
}
