export interface TunnelRequest {
  bindAddr: string;
  bindPort: number;
  accept: () => void;
  reject: () => void;
}
