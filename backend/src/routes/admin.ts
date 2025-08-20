import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { database } from '../database';
import { verifyToken, requireAdmin } from '../auth';
import { ensureDirectoryExists, generateUniqueFileName } from '../fileUtils';
import path from 'path';

export async function adminRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', verifyToken);
    fastify.addHook('preHandler', requireAdmin);

    fastify.get('/users', async () => {
        const users = await database.all('SELECT id, username, role, created_at FROM users');
        return { users };
    });

    fastify.post('/users', async (request, reply) => {
        const { username, password, role } = request.body as { username: string; password: string; role: string };

        if (!username || !password || !role) {
            reply.code(400).send({ error: 'Username, password, and role are required' });
            return;
        }

        if (!username.trim()) {
            reply.code(400).send({ error: 'Username cannot be empty' });
            return;
        }

        if (username.length < 3) {
            reply.code(400).send({ error: 'Username must be at least 3 characters long' });
            return;
        }

        if (username.length > 30) {
            reply.code(400).send({ error: 'Username must be less than 30 characters' });
            return;
        }
        
        if (password.length < 8) {
            reply.code(400).send({ error: 'Password must be at least 8 characters long' });
            return;
        }

        if (password.length > 100) {
            reply.code(400).send({ error: 'Password must be less than 100 characters' });
            return;
        }
        
        if (!['admin', 'user'].includes(role)) {
            reply.code(400).send({ error: 'Role must be either admin or user' });
            return;
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 12);
            const userId = uuidv4();

            await database.run(
                'INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)',
                [userId, username, hashedPassword, role]
            );

            reply.send({ id: userId, username, role });
        } catch (error) {
            reply.code(400).send({ error: 'Username already exists' });
        }
    });

    fastify.delete('/users/:id', async (request) => {
        const { id } = request.params as { id: string };
        await database.run('DELETE FROM users WHERE id = ?', [id]);
        return { success: true };
    });


    fastify.post('/applications', async (request, reply) => {
        const { name } = request.body as { name: string };

        if (!name || !name.trim()) {
            reply.code(400).send({ error: 'Application name is required' });
            return;
        }

        if (name.length < 3) {
            reply.code(400).send({ error: 'Application name must be at least 3 characters long' });
            return;
        }

        if (name.length > 50) {
            reply.code(400).send({ error: 'Application name must be less than 50 characters' });
            return;
        }

        const sanitizedName = name.replace(/[<>:"/\|?*]/g, '_');
        if (sanitizedName !== name) {
            reply.code(400).send({ error: 'Application name contains invalid characters' });
            return;
        }

        try {
            const appId = uuidv4();
            const apiKey = `app_${uuidv4().replace(/-/g, '')}`;
            const folderPath = path.join('./uploads', name);

            await ensureDirectoryExists(folderPath);

            await database.run(
                'INSERT INTO applications (id, name, api_key, folder_path) VALUES (?, ?, ?, ?)',
                [appId, name, apiKey, folderPath]
            );

            reply.send({ id: appId, name, api_key: apiKey, folder_path: folderPath });
        } catch (error) {
            reply.code(400).send({ error: 'Application name already exists' });
        }
    });

    fastify.delete('/applications/:id', async (request) => {
        const { id } = request.params as { id: string };
        await database.run('DELETE FROM applications WHERE id = ?', [id]);
        await database.run('DELETE FROM files WHERE application_id = ?', [id]);
        return { success: true };
    });

    fastify.put('/applications/:id/regenerate-key', async (request) => {
        const { id } = request.params as { id: string };
        const newApiKey = `app_${uuidv4().replace(/-/g, '')}`;

        await database.run('UPDATE applications SET api_key = ? WHERE id = ?', [newApiKey, id]);

        return { api_key: newApiKey };
    });
}