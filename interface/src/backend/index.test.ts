// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
describe('bootBackend', () => {
  it('uses the local demo backend when no Supabase env is set', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', ''); const { bootBackend } = await import('./index');
    const boot = await bootBackend();
    expect('backend' in boot && boot.backend.mode).toBe('local');
  });
});
