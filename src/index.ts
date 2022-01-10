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
  if (tunnel.http) {
    tunnel.channelWrite(
      `Proxy opened on\nhttp://${tunnel.address}\nhttps://${tunnel.address}\n`
    );
  } else {
    tunnel.channelWrite(`Proxy opened on ${tunnel.port} port\n`);
  }
});

sshServer.run();
proxyServer.run();
