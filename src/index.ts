import { ProxyServer } from "./proxy/proxy";
import { Monitor } from "./monitor/monitor";

const proxy = new ProxyServer();
proxy.run();

const monitor = new Monitor();
monitor.run();

proxy.on("tunnel-packet", (tunnel, packet) => monitor.onTunnelPacket(packet));
proxy.on("tunnel-packet-data", (tunnel, chunk) =>
  monitor.onTunnelPacketData(chunk)
);

// TODO close all connections
// process.on("SIGINT", () => {
//   proxy.stop();
//   monitor.stop();
// });
