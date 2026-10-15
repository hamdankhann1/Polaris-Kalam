import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-dev-server',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && (req.url.startsWith('/api/rooms') || req.url.startsWith('/api/bookings'))) {
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
                  const roomsMod = await import('./api/rooms.js');
                  return roomsMod.default(req, res);
                }
                if (req.url.startsWith('/api/bookings')) {
                  const bookingsMod = await import('./api/bookings.js');
                  return bookingsMod.default(req, res);
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
    open: false,
  },
});
