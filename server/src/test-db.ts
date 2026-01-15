
import dotenv from 'dotenv';
import { Pool } from 'pg';
import path from 'path';

// Load env from root
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('Testing DB Connection...');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('Successfully connected to PostgreSQL!');
        const res = await client.query('SELECT NOW()');
        console.log('Current Time from DB:', res.rows[0].now);
        client.release();
        await pool.end();
        process.exit(0);
    } catch (err: any) {
        console.error('Connection Error:', err.message);
        if (err.code === 'ECONNREFUSED') {
            console.error('Make sure Docker is running and the database container is up.');
        }
        process.exit(1);
    }
}

testConnection();
