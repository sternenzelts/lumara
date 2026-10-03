export interface AyakaRuntime { replay(): Promise<void>; skip(): void; cycleSound(): number; getLevel(): number; dispose(): void }
export function createAyakaRuntime(host: HTMLElement, onComplete: () => void, options?: { grade?: 'A' | 'S+' | 'S++'; ayaka?: boolean; theme?: string }): AyakaRuntime;
