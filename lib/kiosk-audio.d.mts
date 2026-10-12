export type KioskAudioState = "blocked" | "activating" | "ready" | "unavailable"
export interface KioskAudio {
  activate(): Promise<boolean>
  play(type: "success" | "warning" | "error"): boolean
  stop(): void
  getState(): KioskAudioState
  subscribe(listener: (state: KioskAudioState) => void): () => void
}
export function getKioskAudio(): KioskAudio
export function attachKioskAudioRecovery(audio: KioskAudio, browserWindow: Window, page: Document, intervalMs?: number): () => void
export function createKioskAudio(options: {
  createContext: () => AudioContext | null
  loadSuccess: (context: AudioContext) => Promise<AudioBuffer>
  activationTimeoutMs?: number
}): KioskAudio
