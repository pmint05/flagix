import { EventSource as EventSourcePolyfill } from 'eventsource';

export interface SseConfig {
  baseUrl: string;
  sdkKey: string;
  onMessage: (event: any) => void;
  reconnectJitter?: number;
}

export class SseClient {
  private eventSource: any | null = null;
  private reconnectTimeout: any = null;
  private reconnectAttempt = 0;
  private isExplicitlyClosed = false;

  constructor(private readonly config: SseConfig) {}

  connect() {
    this.isExplicitlyClosed = false;
    this.reconnectAttempt = 0;
    this.setupEventSource();
  }

  private setupEventSource() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    const isBrowser = typeof window !== 'undefined';
    const usePolyfill = !isBrowser || !((window as any).EventSource);
    
    // In Browser, use query param for SDK Key since native EventSource doesn't support headers.
    // The backend's SdkKeyGuard specifically allows this for SSE.
    const url = new URL(`${this.config.baseUrl}/flags/stream`);
    if (isBrowser) {
      url.searchParams.set('sdkKey', this.config.sdkKey);
    }

    const ES = usePolyfill ? EventSourcePolyfill : (window as any).EventSource;
    const options = usePolyfill ? { headers: { 'X-SDK-Key': this.config.sdkKey } } : undefined;

    try {
      this.eventSource = new ES(url.toString(), options);

      this.eventSource.onmessage = (e: any) => {
        try {
          // Native NestJS SSE implementation wraps data in a 'data' property
          const data = JSON.parse(e.data);
          this.config.onMessage(data);
          this.reconnectAttempt = 0; // Reset backoff on success
        } catch (err) {
          console.error('Flagix: Failed to parse SSE message', err);
        }
      };

      this.eventSource.onerror = (e: any) => {
        // SSE natively attempts to reconnect, but we want explicit control 
        // over exponential backoff and jitter to protect the backend.
        this.handleReconnect();
      };
    } catch (err) {
      console.error('Flagix: Failed to initialize SSE', err);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.isExplicitlyClosed) return;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    const baseDelay = 1000;
    const maxDelay = 30000;
    const jitter = this.config.reconnectJitter ?? 0.5;
    
    const delay = Math.min(baseDelay * Math.pow(2, this.reconnectAttempt), maxDelay);
    const jitteredDelay = delay * (1 + (Math.random() * jitter * 2 - jitter));

    this.reconnectAttempt++;
    
    this.reconnectTimeout = setTimeout(() => {
      if (!this.isExplicitlyClosed) {
        this.setupEventSource();
      }
    }, jitteredDelay);
  }

  close() {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
