import { serve } from '@hono/node-server';
import { config } from './config';
import { createApp } from './app';
import { db } from './db';

const app = createApp(db);

serve(
  {
    fetch: app.fetch,
    port: config.port,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
