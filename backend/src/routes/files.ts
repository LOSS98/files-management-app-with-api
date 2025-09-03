import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { database } from '../database';
import { verifyApiKey } from '../auth';
import { config } from '../config';
import {
    generateUniqueFileName,
    convertImageToWebp,
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

        const maxSize = 1024 * 1024 * 1024;
        const buffer = await data.toBuffer();
        if (buffer.length > maxSize) {
            reply.code(400).send({ error: 'File too large. Maximum size is 1GB' });
            return;
        }

        const { application } = request;
        
        let isPublic = false;
        if (data.fields && 'is_public' in data.fields) {
            const publicField = data.fields.is_public;
            if (typeof publicField === 'object' && 'value' in publicField) {
                isPublic = publicField.value === 'true';
            }
        }
        
        const originalName = data.filename;
        const uniqueName = generateUniqueFileName(originalName);
        const filePath = path.join(application.folder_path, uniqueName);

        await fs.writeFile(filePath, buffer);

        const stats = await getFileStats(filePath);
        const fileId = uuidv4();

        database.run(
            'INSERT INTO files (id, application_id, original_name, current_name, file_path, file_type, size, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [fileId, application.id, originalName, uniqueName, filePath, data.mimetype, stats.size, isPublic ? 1 : 0]
        );

        const response: any = {
            id: fileId,
            original_name: originalName,
            current_name: uniqueName,
            file_type: data.mimetype,
            size: stats.size,
            is_public: isPublic
        };

        if (isPublic) {
            response.public_url = `${config.getBackendUrl()}/public/${fileId}`;
        }

        reply.send(response);
    });

    fastify.get('', (request) => {
        const { application } = request;
        const files = database.all(
            'SELECT * FROM files WHERE application_id = ?',
            [application.id]
        ).map((file: any) => {
            const mappedFile = {
                ...file,
                is_public: file.is_public === 1
            };
            
            if (mappedFile.is_public) {
                mappedFile.public_url = `${config.getBackendUrl()}/public/${file.id}`;
            }
            
            return mappedFile;
        });
        return { files };
    });

    fastify.put('/:id/rename', async (request, reply) => {
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

        const file = database.get(
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

            database.run(
                'UPDATE files SET current_name = ?, file_path = ? WHERE id = ?',
                [newFileName, newPath, id]
            );

            reply.send({ success: true, new_name: newFileName });
        } catch (error) {
            reply.code(500).send({ error: 'Failed to rename file' });
        }
    });

    fastify.post('/:id/convert-to-webp', async (request, reply) => {
        const { id } = request.params as { id: string };
        const { application } = request;

        const file = database.get(
            'SELECT * FROM files WHERE id = ? AND application_id = ?',
            [id, application.id]
        );

        if (!file) {
            reply.code(404).send({ error: 'File not found' });
            return;
        }

        if (!file.file_type.startsWith('image/') || file.file_type === 'image/webp') {
            reply.code(400).send({ error: 'File must be a non-WebP image' });
            return;
        }

        const webpFileName = file.current_name.replace(/\.[^.]+$/, '.webp');
        const webpPath = path.join(application.folder_path, webpFileName);

        try {
            await convertImageToWebp(file.file_path, webpPath);

            const stats = await getFileStats(webpPath);
            const webpFileId = uuidv4();

            database.run(
                'INSERT INTO files (id, application_id, original_name, current_name, file_path, file_type, size, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [webpFileId, application.id, file.original_name + ' (WebP)', webpFileName, webpPath, 'image/webp', stats.size, file.is_public]
            );

            reply.send({
                id: webpFileId,
                original_name: file.original_name + ' (WebP)',
                current_name: webpFileName,
                file_type: 'image/webp',
                size: stats.size,
                is_public: file.is_public === 1
            });
        } catch (error) {
            reply.code(500).send({ error: 'Failed to convert image to WebP' });
        }
    });

    fastify.delete('/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const { application } = request;

        const file = database.get(
            'SELECT * FROM files WHERE id = ? AND application_id = ?',
            [id, application.id]
        );

        if (!file) {
            reply.code(404).send({ error: 'File not found' });
            return;
        }

        await deleteFile(file.file_path);
        database.run('DELETE FROM files WHERE id = ?', [id]);

        reply.send({ success: true });
    });

    fastify.get('/:id/download', async (request, reply) => {
        const { id } = request.params as { id: string };
        const { application } = request;

        const file = database.get(
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

    fastify.patch('/:id/visibility', async (request, reply) => {
        const { id } = request.params as { id: string };
        const { is_public } = request.body as { is_public: boolean };
        const { application } = request;

        if (typeof is_public !== 'boolean') {
            reply.code(400).send({ error: 'is_public must be a boolean value' });
            return;
        }

        const file = database.get(
            'SELECT * FROM files WHERE id = ? AND application_id = ?',
            [id, application.id]
        );

        if (!file) {
            reply.code(404).send({ error: 'File not found' });
            return;
        }

        database.run(
            'UPDATE files SET is_public = ? WHERE id = ?',
            [is_public ? 1 : 0, id]
        );

        const response: any = { 
            success: true, 
            is_public: is_public,
            message: `File ${is_public ? 'made public' : 'made private'}` 
        };

        if (is_public) {
            response.public_url = `${config.getBackendUrl()}/public/${id}`;
        }

        reply.send(response);
    });
}