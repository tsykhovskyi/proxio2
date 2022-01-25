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
  return "https://" + config.monitorDomainName + monitorAppPortSuffix();
}

export function tunnelMonitorUrl(tunnel: Tunnel) {
  if (!tunnel.http) {
    return "";
  }

  return (
    "https://" +
    config.monitorDomainName +
    monitorAppPortSuffix() +
    "/" +
    tunnelSubdomain(tunnel)
  );
}

function tunnelSubdomain(tunnel: Tunnel): string {
  return tunnel.hostname.slice(
    0,
    tunnel.hostname.lastIndexOf(config.domainName) - 1
  );
}

function monitorAppPortSuffix() {
  return config.monitorAppDevPort
    ? ":" + config.monitorAppDevPort
    : config.httpsPort !== 443
    ? ":" + config.httpsPort
    : "";
}
