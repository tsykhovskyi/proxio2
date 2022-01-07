import { TunnelInterface } from '../ssh/server';
import { emptyResponse, mutualPipe, proxyNotFoundResponse } from './stream';
import { createServer, Server } from 'net';
import { DuplexReadableSearcher } from './stream/duplex-readable-searcher';
import { hostSearcher } from './stream/host-searcher';
import { log } from '../helper/logger';

export class ProxyServer {
  private sshTunnels: TunnelInterface[] = [];
  private server: Server;

  constructor() {
    this.server = createServer();
  }

  addTunnel(tunnel: TunnelInterface) {
    this.sshTunnels.push(tunnel);
  }

  run() {
    this.server.on('connection', async socket => {
      const {remoteAddress, remotePort} = socket;
      if (remoteAddress == undefined || remotePort == undefined) {
        return socket.end();
      }

      const searchableSocket = new DuplexReadableSearcher(socket, hostSearcher);
      const host = await searchableSocket.target;
      log('Host header is found: ', host);

      if (host === null) {
        mutualPipe(searchableSocket, emptyResponse());
        return;
      }

      const targetTunnel = this.sshTunnels.find(tunnel => tunnel.bindAddr === host);
      if (targetTunnel === undefined) {
        mutualPipe(searchableSocket, proxyNotFoundResponse(host));
        return;
      }

      targetTunnel.sshConnection.forwardOut(
        targetTunnel.bindAddr,
        targetTunnel.bindPort,
        remoteAddress,
        remotePort,
        (err, sshChannel) => {
          if (err) {
            searchableSocket.end();
            return console.error('not working: ' + err);
          }
          mutualPipe(searchableSocket, sshChannel);
          // socket.pipe(consoleRequest, {end: false});
          // upstream.pipe(consoleResponse, {end: false});
        });
    })
    this.server.listen(80);
  }

  stop() {
    this.server.close();
  }
}
