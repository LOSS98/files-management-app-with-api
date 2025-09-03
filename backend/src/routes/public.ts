import { FastifyInstance } from 'fastify';
import fs from 'fs/promises';
import { database } from '../database';

export async function publicRoutes(fastify: FastifyInstance) {
    fastify.get('/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        const file = database.get(
            'SELECT * FROM files WHERE id = ? AND is_public = 1',
            [id]
        );

        if (!file) {
            reply.code(404).send({ error: 'Public file not found' });
            return;
        }

        try {
            const fileBuffer = await fs.readFile(file.file_path);
            reply
                .type(file.file_type)
                .header('Cache-Control', 'public, max-age=31536000')
                .send(fileBuffer);
        } catch (error) {
            reply.code(404).send({ error: 'File not found on disk' });
        }
    });

    fastify.get('/:id/info', async (request, reply) => {
        const { id } = request.params as { id: string };

        const file = database.get(
            'SELECT id, original_name, current_name, file_type, size, created_at FROM files WHERE id = ? AND is_public = 1',
            [id]
        );

        if (!file) {
            reply.code(404).send({ error: 'Public file not found' });
            return;
        }

        reply.send({
            id: file.id,
            original_name: file.original_name,
            current_name: file.current_name,
            file_type: file.file_type,
            size: file.size,
            created_at: file.created_at,
            is_public: true
        });
    });
}