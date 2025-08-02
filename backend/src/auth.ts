import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { FastifyRequest, FastifyReply } from 'fastify';
import { database } from './database';
import { AuthToken } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
if (!process.env.JWT_SECRET) {
    console.warn('JWT_SECRET not set, using fallback. Set JWT_SECRET for production!');
}

export async function authenticateUser(username: string, password: string) {
    if (!username || !password) {
        return null;
    }
    
    const user = await database.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;

    const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    return { token, user: { id: user.id, username: user.username, role: user.role } };
}

export async function verifyToken(request: FastifyRequest, reply: FastifyReply) {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        reply.code(401).send({ error: 'Unauthorized' });
        return;
    }

    try {
        const token = authHeader.substring(7);
        if (!token) {
            reply.code(401).send({ error: 'Token required' });
            return;
        }
        const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & AuthToken;
        request.user = decoded;
    } catch (error) {
        reply.code(401).send({ error: 'Invalid token' });
    }
}

export async function verifyApiKey(request: FastifyRequest, reply: FastifyReply) {
    const apiKey = request.headers['x-api-key'] as string;
    if (!apiKey) {
        reply.code(401).send({ error: 'API key required' });
        return;
    }

    const application = await database.get('SELECT * FROM applications WHERE api_key = ?', [apiKey]);
    if (!application) {
        reply.code(401).send({ error: 'Invalid API key' });
        return;
    }

    request.application = application;
}

export function requireAdmin(request: FastifyRequest, reply: FastifyReply, done: () => void) {
    if (request.user?.role !== 'admin') {
        reply.code(403).send({ error: 'Admin access required' });
        return;
    }
    done();
}

declare module 'fastify' {
    interface FastifyRequest {
        user?: AuthToken;
        application?: any;
    }
}