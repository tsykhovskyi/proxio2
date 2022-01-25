import { ProxyServer } from "./proxy/proxy";
import { Monitor } from "./monitor/monitor";

const proxy = new ProxyServer();
proxy.run();

const monitor = new Monitor(proxy.tunnelStorage);
monitor.run();

// TODO close all connections
// process.on("SIGINT", () => {
//   proxy.stop();
//   monitor.stop();
// });
