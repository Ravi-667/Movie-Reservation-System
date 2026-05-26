$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$email = "pay_user$timestamp@example.com"
$password = "securepassword"

# 1. Login/Register
Write-Host "1. Registering new User..."
$registerBody = @{
    email    = $email
    password = $password
    name     = "Payment Tester"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/auth/register" -Method Post -Body $registerBody -ContentType "application/json" | Out-Null

Write-Host "2. Logging in..."
$loginBody = @{
    email    = $email
    password = $password
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token
$authHeader = @{ Authorization = "Bearer $token" }

# 2. Create Reservation (Assume Showtime 1, Seat A1... wait, A1 might be taken from previous test. Let's use B1)
# Create a screen, add seats... assume default screen 1 has row B
# Seat B1
$showtimeId = 1
$seats = Invoke-RestMethod -Uri "http://localhost:3000/api/reservations/showtime/$showtimeId" -Method Get
$seatB1 = $seats | Where-Object { $_.row -eq "B" -and $_.number -eq 1 }

if ($seatB1.status -ne "AVAILABLE") {
    Write-Host "WARNING: Seat B1 is not available. Test might fail."
}

Write-Host "3. Creating Reservation for Seat B1..."
$bookBody = @{
    showtimeId = $showtimeId
    seatIds    = @($seatB1.id)
} | ConvertTo-Json

$bookResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/reservations" -Method Post -Body $bookBody -Headers $authHeader -ContentType "application/json"
$reservationId = $bookResponse.id
Write-Host "Reservation Created: ID $reservationId"

# 3. Confirm Payment
Write-Host "`n4. Confirming Payment..."
$paymentBody = @{
    reservationId = $reservationId
    paymentToken  = "tok_visa_dummy"
} | ConvertTo-Json

try {
    $confirmResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/payments/confirm" -Method Post -Body $paymentBody -Headers $authHeader -ContentType "application/json"
    Write-Host "Payment Successful!"
    Write-Host "Ticket ID: $($confirmResponse.ticketId)"
    Write-Host "Status: $($confirmResponse.reservation.status)"
}
catch {
    Write-Host "Payment Failed: $_"
    exit 1
}
