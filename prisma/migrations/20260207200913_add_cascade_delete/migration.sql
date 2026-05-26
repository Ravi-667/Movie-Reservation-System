-- DropForeignKey
ALTER TABLE "SeatReservation" DROP CONSTRAINT "SeatReservation_reservationId_fkey";

-- AddForeignKey
ALTER TABLE "SeatReservation" ADD CONSTRAINT "SeatReservation_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
