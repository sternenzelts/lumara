import type { Backend } from './types';
import { createLocalBackend } from './local';

// Integration seam: Claude supplies a Backend before mounting the UI.
// The UI never needs to know how an artifact adapter detects its runtime.
let instance: Backend | null = null;
export function configureBackend(backend: Backend) { instance = backend; }
export function getBackend(): Backend { return instance ||= createLocalBackend(); }
