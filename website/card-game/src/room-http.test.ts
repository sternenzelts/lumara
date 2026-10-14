import { describe, expect, it, vi } from 'vitest';
import { roomHttpHandler } from './room-http';
import { RoomError, type RoomRequest } from './online-service';
import { createState } from './engine';

const origin = 'https://sternenzelts.github.io';
const snapshot = { code: 'abcdef123456', playerID: '0', version: 1, G: createState(2) };
const setup = () => {
  const authenticate = vi.fn(async token => token === 'valid-user-token' ? 'verified-user' : null);
  const service = vi.fn(async (_user: string, _body: RoomRequest) => snapshot);
  return { authenticate, service, handler: roomHttpHandler({ authenticate, service, origins: [origin] }) };
};
const request = (token = 'valid-user-token', body: unknown = { op: 'view', code: snapshot.code, userID: 'forged-user' }) => new Request('https://example.test/last-light', { method: 'POST', headers: { origin, authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) });

describe('Edge Function authentication boundary', () => {
  it('uses verified identity instead of the caller claimed user ID', async () => {
    const { handler, service } = setup(); const response = await handler(request());
    expect(response.status).toBe(200); expect(service.mock.calls[0][0]).toBe('verified-user');
    expect(response.headers.get('access-control-allow-origin')).toBe(origin); expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it('rejects unsigned requests, expired sessions, foreign origins and malformed bodies', async () => {
    const { handler, service } = setup();
    expect((await handler(new Request('https://example.test', { method: 'POST', body: '{}' }))).status).toBe(401);
    expect((await handler(request('expired'))).status).toBe(401);
    expect((await handler(new Request('https://example.test', { method: 'POST', headers: { origin: 'https://untrusted.test' } }))).status).toBe(403);
    expect((await handler(new Request('https://example.test', { method: 'POST', headers: { authorization: 'Bearer valid-user-token' }, body: '{bad' }))).status).toBe(400);
    expect(service).not.toHaveBeenCalled();
  });
  it('allows preflight and never returns raw storage errors or private state', async () => {
    const { handler, service } = setup(); expect((await handler(new Request('https://example.test', { method: 'OPTIONS', headers: { origin } }))).status).toBe(204);
    service.mockRejectedValueOnce(new Error('private deck secret database password'));
    const failed = await handler(request()); expect(failed.status).toBe(503); expect(await failed.text()).not.toContain('secret');
    service.mockRejectedValueOnce(new RoomError(409, 'The table changed.', snapshot));
    const conflict = await handler(request()); expect(conflict.status).toBe(409); expect((await conflict.json()).snapshot).toEqual(snapshot);
  });
});
