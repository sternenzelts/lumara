export function createRuntime(host: HTMLElement, onFinished: () => void, base: string): { replay(): Promise<void>; skip(): void; dispose(): void; getLevel(): number };
