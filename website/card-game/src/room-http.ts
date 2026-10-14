import { RoomError, type RoomRequest, type RoomSnapshot } from './online-service';

export function roomHttpHandler({ authenticate, service, origins }: {
  authenticate: (token: string) => Promise<string | null>;
  service: (user: string, body: RoomRequest) => Promise<RoomSnapshot>;
  origins: string[];
}) {
  return async (req: Request): Promise<Response> => {
    const origin = req.headers.get('origin');
    const headers = { 'Access-Control-Allow-Origin': origin && origins.includes(origin) ? origin : origins[0],
      'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin', 'Cache-Control': 'no-store' };
    const response = (body: object, status = 200) => Response.json(body, { status, headers });
    if (origin && !origins.includes(origin)) return response({ error: 'This origin is not allowed.' }, 403);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (req.method !== 'POST') return response({ error: 'Use POST.' }, 405);
    const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) return response({ error: 'Sign in to join a room.' }, 401);
    try {
      const user = await authenticate(token);
      if (!user) return response({ error: 'Your session expired. Reconnect to the room.' }, 401);
      const text = await req.text();
      if (text.length > 16000) return response({ error: 'The request is too large.' }, 413);
      let body: RoomRequest;
      try { body = JSON.parse(text); } catch { return response({ error: 'Invalid request.' }, 400); }
      return response(await service(user, body));
    } catch (error) {
      if (error instanceof RoomError) return response({ error: error.message, snapshot: error.snapshot }, error.status);
      if (error instanceof Error && error.message.startsWith('You already have five')) return response({ error: error.message }, 429);
      return response({ error: 'The room could not be updated. Try again shortly.' }, 503);
    }
  };
}
