import { FastifyInstance } from 'fastify';
import { authenticateUser } from '../auth';

export async function authRoutes(fastify: FastifyInstance) {
    fastify.post('/login', async (request, reply) => {
        const { username, password } = request.body as { username: string; password: string };

        const result = await authenticateUser(username, password);
        if (!result) {
            reply.code(401).send({ error: 'Invalid credentials' });
            return;
        }

        reply.send(result);
    });
}