import { Statistic } from "../proxy/contracts/tunnel";

export class TunnelStatistic implements Statistic {
  inboundTraffic: number = 0;
  outboundTraffic: number = 0;
  traffic: number = 0;
  requests: number = 0;
  responses: number = 0;

  inboundChunk(chunk: Buffer) {
    console.log(`chunk in type: ${chunk.byteLength}, size: ${chunk.length}`);
    this.inboundTraffic += chunk.length;
    this.traffic += chunk.length;
  }

  outboundChunk(chunk: Buffer) {
    console.log(`chunk out type: ${chunk.byteLength}, size: ${chunk.length}`);
    this.outboundTraffic += chunk.length;
    this.traffic += chunk.length;
  }

  request() {
    this.requests++;
  }

  response() {
    this.responses++;
  }
}
