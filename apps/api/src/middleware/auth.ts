import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';
import { config } from '../config';

export type AuthVariables = {
  userId: string;
  userEmail: string;
};

export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization header required' }, 401);
    }

    const token = authHeader.slice(7);

    let payload;
    try {
      payload = await verify(token, config.jwtSecret);
    } catch {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    c.set('userId', payload.sub as string);
    c.set('userEmail', payload.email as string);

    return next();
  },
);
