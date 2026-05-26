const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:password@localhost:5432/movie_reservation?schema=public',
});

async function testConnection() {
  try {
    await client.connect();
    console.log('Connected successfully to PostgreSQL!');
    const res = await client.query('SELECT NOW()');
    console.log(res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('Connection error', err.stack);
  }
}

testConnection();
