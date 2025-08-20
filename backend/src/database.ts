import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export class Database {
    private db: sqlite3.Database;

    constructor() {
        const dbPath = './data/database.sqlite';
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
                throw err;
            }
            console.log('Connected to SQLite database.');
        });
        this.init();
    }

    private async init() {

        await this.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        await this.run(`
      CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        api_key TEXT UNIQUE NOT NULL,
        folder_path TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        await this.run(`
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        application_id TEXT NOT NULL,
        original_name TEXT NOT NULL,
        current_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (application_id) REFERENCES applications (id)
      )
    `);

        const adminExists = await this.get('SELECT id FROM users WHERE role = ?', ['admin']);
        if (!adminExists) {
            const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
            const hashedPassword = await bcrypt.hash(defaultPassword, 12);
            await this.run('INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)',
                [uuidv4(), 'admin', hashedPassword, 'admin']);
        }
    }

    async run(sql: string, params: any[] = []): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async get(sql: string, params: any[] = []): Promise<any> {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async all(sql: string, params: any[] = []): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    close() {
        this.db.close();
    }
}

export const database = new Database();