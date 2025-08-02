import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { database } from '../database';
import { verifyApiKey } from '../auth';
import {
    generateUniqueFileName,
    convertImageToSvg,
    deleteFile,
    getFileStats
} from '../fileUtils';

export async function fileRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', verifyApiKey);

    fastify.post('/upload', async (request, reply) => {
        const data = await request.file();
        if (!data) {
            reply.code(400).send({ error: 'No file uploaded' });
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];
        if (!allowedTypes.includes(data.mimetype || '')) {
            reply.code(400).send({ error: 'File type not allowed' });
            return;
        }

        const maxSize = 10 * 1024 * 1024;
        const buffer = await data.toBuffer();
        if (buffer.length > maxSize) {
            reply.code(400).send({ error: 'File too large. Maximum size is 10MB' });
            return;
        }

        const { application } = request;
        const originalName = data.filename;
        const uniqueName = generateUniqueFileName(originalName);
        const filePath = path.join(application.folder_path, uniqueName);

        await fs.writeFile(filePath, buffer);

        const stats = await getFileStats(filePath);
        const fileId = uuidv4();

        await database.run(
            'INSERT INTO files (id, application_id, original_name, current_name, file_path, file_type, size) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [fileId, application.id, originalName, uniqueName, filePath, data.mimetype, stats.size]
        );

        reply.send({
            id: fileId,
            original_name: originalName,
            current_name: uniqueName,
            file_type: data.mimetype,
            size: stats.size
        });
    });

    fastify.get('/files', async (request) => {
        const { application } = request;
        const files = await database.all(
            'SELECT * FROM files WHERE application_id = ?',
            [application.id]
        );
        return { files };
    });

    fastify.put('/files/:id/rename', async (request, reply) => {
        const { id } = request.params as { id: string };
        const { new_name } = request.body as { new_name: string };
        const { application } = request;

        if (!new_name || new_name.trim().length === 0) {
            reply.code(400).send({ error: 'New name is required' });
            return;
        }

        const sanitizedName = new_name.replace(/[<>:"/\|?*]/g, '_');
        if (sanitizedName !== new_name) {
            reply.code(400).send({ error: 'Filename contains invalid characters' });
            return;
        }

        const file = await database.get(
            'SELECT * FROM files WHERE id = ? AND application_id = ?',
            [id, application.id]
        );

        if (!file) {
            reply.code(404).send({ error: 'File not found' });
            return;
        }

        const oldPath = file.file_path;
        const ext = path.extname(file.current_name);
        const newFileName = `${new_name}${ext}`;
        const newPath = path.join(application.folder_path, newFileName);

        try {
            await fs.rename(oldPath, newPath);

            await database.run(
                'UPDATE files SET current_name = ?, file_path = ? WHERE id = ?',
                [newFileName, newPath, id]
            );

            reply.send({ success: true, new_name: newFileName });
        } catch (error) {
            reply.code(500).send({ error: 'Failed to rename file' });
        }
    });

    fastify.post('/files/:id/convert-to-svg', async (request, reply) => {
        const { id } = request.params as { id: string };
        const { application } = request;

        const file = await database.get(
            'SELECT * FROM files WHERE id = ? AND application_id = ?',
            [id, application.id]
        );

        if (!file) {
            reply.code(404).send({ error: 'File not found' });
            return;
        }

        if (!file.file_type.startsWith('image/')) {
            reply.code(400).send({ error: 'File must be an image' });
            return;
        }

        const svgFileName = file.current_name.replace(/\.[^.]+$/, '.svg');
        const svgPath = path.join(application.folder_path, svgFileName);

        try {
            await convertImageToSvg(file.file_path, svgPath);

            const stats = await getFileStats(svgPath);
            const svgFileId = uuidv4();

            await database.run(
                'INSERT INTO files (id, application_id, original_name, current_name, file_path, file_type, size) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [svgFileId, application.id, file.original_name + ' (SVG)', svgFileName, svgPath, 'image/svg+xml', stats.size]
            );

            reply.send({
                id: svgFileId,
                original_name: file.original_name + ' (SVG)',
                current_name: svgFileName,
                file_type: 'image/svg+xml',
                size: stats.size
            });
        } catch (error) {
            reply.code(500).send({ error: 'Failed to convert image to SVG' });
        }
    });

    fastify.delete('/files/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const { application } = request;

        const file = await database.get(
            'SELECT * FROM files WHERE id = ? AND application_id = ?',
            [id, application.id]
        );

        if (!file) {
            reply.code(404).send({ error: 'File not found' });
            return;
        }

        await deleteFile(file.file_path);
        await database.run('DELETE FROM files WHERE id = ?', [id]);

        reply.send({ success: true });
    });

    fastify.get('/files/:id/download', async (request, reply) => {
        const { id } = request.params as { id: string };
        const { application } = request;

        const file = await database.get(
            'SELECT * FROM files WHERE id = ? AND application_id = ?',
            [id, application.id]
        );

        if (!file) {
            reply.code(404).send({ error: 'File not found' });
            return;
        }

        try {
            const fileBuffer = await fs.readFile(file.file_path);
            reply
                .type(file.file_type)
                .header('Content-Disposition', `attachment; filename="${file.current_name}"`)
                .send(fileBuffer);
        } catch (error) {
            reply.code(404).send({ error: 'File not found on disk' });
        }
    });
}