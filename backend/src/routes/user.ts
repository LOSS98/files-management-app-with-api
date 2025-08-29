import { FastifyInstance } from 'fastify';
import { database } from '../database';
import { verifyToken } from '../auth';

export async function userRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', verifyToken);

    fastify.get('/applications', () => {
        const applications = database.all('SELECT * FROM applications');
        return { applications };
    });
}