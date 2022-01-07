import { SshServer, SshServerInterface } from "./ssh/server";
import { ProxyServer } from "./proxy/proxy";

const sshServer: SshServerInterface = new SshServer();
const proxyServer = new ProxyServer();

sshServer.on("tunnel-requested", (tunnel, accept, reject) => {
  // todo validate tunnels
  if (proxyServer.addTunnel(tunnel)) {
    accept();
  } else {
    reject();
  }
});

sshServer.run();
proxyServer.run();
