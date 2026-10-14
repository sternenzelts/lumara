import path from 'node:path';
import serve from 'koa-static';
import { Server } from 'boardgame.io/server';
import { LumaraGame } from './game';

const port = Number(process.env.PORT || 51399);
const origins = process.env.SERVER_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean)
  || [`http://127.0.0.1:${port}`, `http://localhost:${port}`, 'http://127.0.0.1:4180', 'http://localhost:4180'];
const server = Server({ games: [LumaraGame], origins });
server.app.use(serve(path.resolve(__dirname, '../dist')));
server.router.get('/health', ctx => { ctx.body = { ok: true }; });
server.run(port, () => console.log(`Lumara Last Light server: http://127.0.0.1:${port}`));
