// Type declarations for @digitalpersona/devices
// Project: Digital Persona SDK
// Definitions by: Hexodus Team

declare module '@digitalpersona/devices' {
  export enum SampleFormat {
    Raw = 0,
    Intermediate = 1,
    Compressed = 2,
    PngImage = 8
  }

  export enum DeviceModality {
    Unknown = 0,
    Fingerprint = 1,
    Face = 2,
    Iris = 4,
    Voice = 8,
    Signature = 16
  }

  export interface DeviceInfo {
    DeviceID: string
    DeviceModality: DeviceModality
    DeviceType: number
    [key: string]: any
  }

  export interface Sample {
    Data: string // Base64 encoded fingerprint template
    Format: SampleFormat
  }

  export interface SamplesAcquiredEvent {
    samples: Sample[]
  }

  export interface ErrorEvent {
    message?: string
    code?: number
    [key: string]: any
  }

  export class FingerprintReader {
    constructor()
    
    /**
     * Enumerate all connected fingerprint devices
     */
    enumerateDevices(): Promise<DeviceInfo[]>
    
    /**
     * Start acquisition of fingerprint samples
     */
    startAcquisition(format: SampleFormat, deviceId?: string): Promise<void>
    
    /**
     * Stop acquisition of fingerprint samples
     */
    stopAcquisition(): Promise<void>
    
    /**
     * Event handler for when samples are acquired
     */
    on(event: 'SamplesAcquired', handler: (event: SamplesAcquiredEvent) => void): void
    
    /**
     * Event handler for errors
     */
    on(event: 'ErrorOccurred', handler: (event: ErrorEvent) => void): void
    
    /**
     * Event handler for quality reports
     */
    on(event: 'QualityReported', handler: (event: any) => void): void
    
    /**
     * Remove event listener
     */
    off(event: string, handler?: Function): void
  }

  export class FingerprintMatching {
    /**
     * Compare two fingerprint templates
     * Returns a similarity score (0-100)
     */
    static compare(sample1: string, sample2: string): Promise<number>
  }
}
