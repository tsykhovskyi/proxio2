import { ProxyServer } from "./proxy/proxy";
import { Monitor } from "./monitor/monitor";

const proxy = new ProxyServer();
proxy.run();

const monitor = new Monitor();
monitor.run(3000);

process.on("SIGINT", () => {
  proxy.stop();
  monitor.stop();
});
