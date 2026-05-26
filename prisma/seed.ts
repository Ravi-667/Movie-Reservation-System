import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding ...')

    // 1. Create Movies
    const movie1 = await prisma.movie.create({
        data: {
            title: 'Inception',
            description: 'A thief who steals corporate secrets through the use of dream-sharing technology.',
            durationMin: 148,
            releaseDate: new Date('2010-07-16'),
            genre: 'Sci-Fi',
            posterUrl: 'https://image.tmdb.org/t/p/original/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
        },
    })

    const movie2 = await prisma.movie.create({
        data: {
            title: 'The Dark Knight',
            description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham...',
            durationMin: 152,
            releaseDate: new Date('2008-07-18'),
            genre: 'Action',
        },
    })

    console.log(`Created movies: ${movie1.title}, ${movie2.title}`)

    // 2. Create Theater
    const theater = await prisma.theater.create({
        data: {
            name: 'Grand Cinema',
            location: 'Downtown',
        },
    })

    console.log(`Created theater: ${theater.name}`)

    // 3. Create Screen & Seats manually (Simulating controller logic)
    const screen = await prisma.screen.create({
        data: {
            number: 1,
            type: 'IMAX',
            theaterId: theater.id
        }
    });

    const rows = ['A', 'B', 'C', 'D', 'E'];
    const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const seatsData = [];

    for (const row of rows) {
        for (const col of cols) {
            seatsData.push({
                screenId: screen.id,
                row,
                number: col,
                type: 'REGULAR'
            });
        }
    }

    await prisma.seat.createMany({
        data: seatsData
    });

    console.log(`Created Screen ${screen.number} with ${seatsData.length} seats.`);

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
