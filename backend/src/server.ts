import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import staticFiles from '@fastify/static';
import path from 'path';
import { authRoutes } from './routes/auth';
import { adminRoutes } from './routes/admin';
import { userRoutes } from './routes/user';
import { fileRoutes } from './routes/files';
import { publicRoutes } from './routes/public';
import { config } from './config';

const fastify = Fastify({ 
    logger: true,
    bodyLimit: 1024 * 1024 * 1024
});

async function start() {
    await fastify.register(cors, {
        origin: config.getCorsOrigins(),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
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
    await fastify.register(publicRoutes, { prefix: '/public' });

    fastify.setErrorHandler((error, request, reply) => {
        fastify.log.error(error);
        reply.status(500).send({ error: 'Internal Server Error' });
    });

    try {
        await fastify.listen({ port: config.port, host: config.host });
        console.log(`Server running on ${config.getBackendUrl()}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

start();