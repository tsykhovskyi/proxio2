import { SshServer, SshServerInterface } from "./ssh/server";
import { ProxyServer } from "./proxy/proxy";

const sshServer: SshServerInterface = new SshServer();
const proxyServer = new ProxyServer();

sshServer.on("tunnel-requested", (request) => {
  if (proxyServer.canCreate(request)) {
    request.accept();
  } else {
    request.reject();
  }
});

sshServer.on("tunnel-opened", (tunnel) => {
  proxyServer.addTunnel(tunnel);
  tunnel.channelWrite(
    `Proxy opened on http://${tunnel.bindAddr}:${tunnel.bindPort}\n`
  );
});

sshServer.run();
proxyServer.run();
