import path from "path";

export const config = {
  /**
   * Domain name of the proxy
   */
  domainName: process.env.HOSTNAME ?? "localhost",

  /**
   * Subdomain prefix for monitoring service. Ex. "https://monitor.localhost"
   */
  monitorDomainName: process.env.MONITOR_DOMAIN ?? "monitor.localhost",
  monitorAppDevPort: process.env.MONITOR_APP_DEV_PORT,

  /**
   * Non-public port for serving monitor application
   */
  monitorPrivatePort: toInt(process.env.MONITOR_SERVER_PORT, 81),

  /**
   * Path to monitor application static folder.
   */
  monitorApplicationDist:
    process.env.DIST_MONITOR_APP ??
    path.join(__dirname, "../monitor-app/dist/monitor-app"),

  frontPageDist:
    process.env.DIST_FRONTPAGE ?? path.join(__dirname, "./monitor/public"),

  /**
   * SSH server config
   */
  sshPort: toInt(process.env.SSH_PORT, 22),

  /**
   * Absolute path to SSH server private key
   */
  sshPrivateKeyPath:
    process.env.SSH_PRIVATE_KEY_PATH ??
    path.join(__dirname, "../assets/ssh/server_key"),

  /**
   * HTTP server port. Should be 80 for correct workaround.
   */
  httpPort: toInt(process.env.PROXY_HTTP_PORT, 80),
  /**
   * HTTPS server port. Should be 443 for correct workaround.
   */
  httpsPort: toInt(process.env.PROXY_HTTP_PORT, 443),

  /**
   * Absolute path to certificate and PK for proxy server SSL encryption
   */
  sslCertificatePath:
    process.env.SSL_CERTIFICATE_PATH ??
    path.join(__dirname, "../assets/tls/server-cert.pem"),
  sslCertificateKeyPath:
    process.env.SSL_CERTIFICATE_KEY_PATH ??
    path.join(__dirname, "../assets/tls/server-key.pem"),

  /**
   * Allowed TCP port intervals for user tunnels, separated by comma. Ex. "81-89,1000-1010,2222-9999"
   */
  proxyAllowedTcpPorts: "2000-6999",
} as const;

function toInt(v: string | undefined, defaultValue: number) {
  return v ? parseInt(v) : defaultValue;
}
