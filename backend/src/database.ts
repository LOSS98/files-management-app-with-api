import { DatabaseSync } from 'node:sqlite';
import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export class Database {
    private db: DatabaseSync;

    constructor() {
        const dbPath = './data/database.sqlite';
        this.db = new DatabaseSync(dbPath);
        console.log('Connected to SQLite database.');
        this.init();
    }

    private init() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS applications (
                id TEXT PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                api_key TEXT UNIQUE NOT NULL,
                folder_path TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS files (
                id TEXT PRIMARY KEY,
                application_id TEXT NOT NULL,
                original_name TEXT NOT NULL,
                current_name TEXT NOT NULL,
                file_path TEXT NOT NULL,
                file_type TEXT NOT NULL,
                size INTEGER NOT NULL,
                is_public INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (application_id) REFERENCES applications (id)
            )
        `);

        const adminExists = this.get('SELECT id FROM users WHERE role = ?', ['admin']);
        if (!adminExists) {
            const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
            const hashedPassword = bcryptjs.hashSync(defaultPassword, 12);
            this.run('INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)',
                [uuidv4(), 'admin', hashedPassword, 'admin']);
        }
    }

    run(sql: string, params: any[] = []): void {
        const stmt = this.db.prepare(sql);
        stmt.run(...params);
    }

    get(sql: string, params: any[] = []): any {
        const stmt = this.db.prepare(sql);
        return stmt.get(...params);
    }

    all(sql: string, params: any[] = []): any[] {
        const stmt = this.db.prepare(sql);
        return stmt.all(...params) || [];
    }

    close() {
        this.db.close();
    }
}

export const database = new Database();