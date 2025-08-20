import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import staticFiles from '@fastify/static';
import path from 'path';
import { authRoutes } from './routes/auth';
import { adminRoutes } from './routes/admin';
import { userRoutes } from './routes/user';
import { fileRoutes } from './routes/files';

const fastify = Fastify({ 
    logger: true,
    bodyLimit: 1024 * 1024 * 1024
});

async function start() {
    await fastify.register(cors, {
        origin: process.env.NODE_ENV === 'production' 
            ? ['http://localhost:3000', 'https://your-domain.com']
            : true,
        credentials: true
    });

    await fastify.register(multipart, {
        limits: {
            fileSize: 1024 * 1024 * 1024
        }
    });

    await fastify.register(staticFiles, {
        root: path.join(__dirname, '../uploads'),
        prefix: '/uploads/'
    });

    await fastify.register(authRoutes, { prefix: '/api/auth' });
    await fastify.register(adminRoutes, { prefix: '/api/admin' });
    await fastify.register(userRoutes, { prefix: '/api/user' });
    await fastify.register(fileRoutes, { prefix: '/api/files' });

    fastify.setErrorHandler((error, request, reply) => {
        fastify.log.error(error);
        reply.status(500).send({ error: 'Internal Server Error' });
    });

    try {
        await fastify.listen({ port: 3001, host: '0.0.0.0' });
        console.log('Server running on http://localhost:3001');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

start();