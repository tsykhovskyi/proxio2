import { Tunnel } from "./contracts/tunnel";
import { config } from "../config";

export function tunnelHttpUrl(tunnel: Tunnel) {
  if (!tunnel.http) {
    return "";
  }
  return (
    "http://" +
    tunnel.hostname +
    (config.httpPort !== 80 ? ":" + config.httpPort : "")
  );
}

export function tunnelHttpsUrl(tunnel: Tunnel) {
  if (!tunnel.http) {
    return "";
  }
  return (
    "https://" +
    tunnel.hostname +
    (config.httpPort !== 80 ? ":" + config.httpPort : "")
  );
}

export function monitorUrl() {
  return (
    "https://" +
    config.monitorDomainName +
    (config.httpsPort !== 443 ? ":" + config.httpsPort : "")
  );
}

export function tunnelMonitorUrl(tunnel: Tunnel) {
  if (!tunnel.http) {
    return "";
  }
  return (
    "https://" +
    tunnelSubdomain(tunnel) +
    "." +
    config.monitorDomainName +
    (config.httpsPort !== 443 ? ":" + config.httpsPort : "")
  );
}

function tunnelSubdomain(tunnel: Tunnel): string {
  return tunnel.hostname.slice(
    0,
    tunnel.hostname.lastIndexOf(config.domainName) - 1
  );
}
