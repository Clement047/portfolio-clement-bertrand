import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const directory = fileURLToPath(new URL('../.backups/city-diagnostics/', import.meta.url));
const file = directory + '/startup.ndjson';

// Development-only, loopback-only timings. Nothing is sent to an external service
// or included as a production endpoint.
export default function localCityTrace() {
  return { name: 'local-city-startup-trace', hooks: {
    'astro:server:setup': ({ server }) => {
      server.middlewares.use('/__city-startup-trace', async (req, res) => {
        const address = req.socket.remoteAddress ?? '';
        const local = address === '::1' || address === '127.0.0.1' || address === '::ffff:127.0.0.1';
        if (!local || (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host)) { res.statusCode = 403; res.end(); return; }
        res.setHeader('Cache-Control', 'no-store');
        if (req.method === 'GET') {
          const lines = await readFile(file, 'utf8').catch(() => '');
          res.setHeader('Content-Type', 'application/json');
          res.end('[' + lines.trim().split('\n').filter(Boolean).slice(-200).join(',') + ']');
          return;
        }
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
        let body = '', tooLarge = false;
        req.on('data', chunk => { if (body.length + chunk.length > 8192) tooLarge = true; else body += chunk; });
        req.on('end', async () => {
          if (tooLarge) { res.statusCode = 413; res.end(); return; }
          try {
            const value = JSON.parse(body);
            if (typeof value.stage !== 'string' || typeof value.run !== 'string' || !Number.isFinite(value.ms)) throw Error('Invalid timing');
            await mkdir(directory, { recursive: true });
            await appendFile(file, JSON.stringify({ ...value, received: Date.now() }) + '\n');
            res.statusCode = 204; res.end();
          } catch { res.statusCode = 400; res.end(); }
        });
      });
    }
  }};
}
