import { serve } from '@hono/node-server';
import { config } from './config';
import app from './app';

serve(
  {
    fetch: app.fetch,
    port: config.port,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
