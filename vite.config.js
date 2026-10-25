import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables (.env, .env.local) into process.env for API dev server
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  let cachedRoomsMod = null;
  let cachedBookingsMod = null;
  let cachedCategoriesMod = null;
  let cachedFloorsMod = null;
  let cachedRevenueMod = null;

  return {
    plugins: [
      react(),
      {
        name: 'api-dev-server',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && (
              req.url.startsWith('/api/rooms') ||
              req.url.startsWith('/api/bookings') ||
              req.url.startsWith('/api/categories') ||
              req.url.startsWith('/api/floors') ||
              req.url.startsWith('/api/revenue')
            )) {
              if (!res.status) {
                res.status = function(code) {
                  this.statusCode = code;
                  return this;
                };
              }
              if (!res.json) {
                res.json = function(data) {
                  this.setHeader('Content-Type', 'application/json');
                  this.end(JSON.stringify(data));
                  return this;
                };
              }

              let rawBody = '';
              req.on('data', (chunk) => { rawBody += chunk; });
              req.on('end', async () => {
                if (rawBody) {
                  try {
                    req.body = JSON.parse(rawBody);
                  } catch (e) {
                    req.body = rawBody;
                  }
                }
                try {
                  if (req.url.startsWith('/api/rooms')) {
                    if (!cachedRoomsMod) cachedRoomsMod = await import('./api/rooms.js');
                    return cachedRoomsMod.default(req, res);
                  }
                  if (req.url.startsWith('/api/bookings')) {
                    if (!cachedBookingsMod) cachedBookingsMod = await import('./api/bookings.js');
                    return cachedBookingsMod.default(req, res);
                  }
                  if (req.url.startsWith('/api/categories')) {
                    if (!cachedCategoriesMod) cachedCategoriesMod = await import('./api/categories.js');
                    return cachedCategoriesMod.default(req, res);
                  }
                  if (req.url.startsWith('/api/floors')) {
                    if (!cachedFloorsMod) cachedFloorsMod = await import('./api/floors.js');
                    return cachedFloorsMod.default(req, res);
                  }
                  if (req.url.startsWith('/api/revenue')) {
                    if (!cachedRevenueMod) cachedRevenueMod = await import('./api/revenue.js');
                    return cachedRevenueMod.default(req, res);
                  }
                } catch (err) {
                  console.error('[API Dev Server Error]', err);
                  return res.status(500).json({ success: false, error: err.message });
                }
              });
              return;
            }
            next();
          });
        }
      }
    ],
    server: {
      port: 3000,
      host: true, // Enables connecting from mobile phones on local network (e.g. http://192.168.x.x:3000)
      allowedHosts: true,
      open: false,
    },
  };
});
