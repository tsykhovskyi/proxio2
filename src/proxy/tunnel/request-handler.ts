import { config } from "../../config";
import { TunnelRequest } from "../contracts/tunnel";
import { createServer } from "net";
import { generateAlphaNum } from "../../helper/generator";
import { TunnelStorage } from "./storage";

type AddressRequest = {
  subdomain: string;
  hostname: string;
};

export class TunnelRequestHandler {
  private readonly domainName: any;
  private allowedTcpIntervals: [number, number][];

  constructor(private tunnelStorage: TunnelStorage) {
    this.domainName = config.domainName;
    this.allowedTcpIntervals = config.proxyAllowedTcpPorts
      .split(",")
      .map((v) => v.split("-").map((v) => parseInt(v)) as [number, number]);
  }

  /**
   * Return accepted/adjusted tunnel address and port or false if tunnel can not be accepted
   */
  async handle(
    request: TunnelRequest
  ): Promise<{ hostname: string; port: number }> {
    if (request.bindPort !== 80) {
      const port = request.bindPort;

      if (port === 0) {
        // Assign random port to user
        let attemptNum = 0;
        while (attemptNum < 10) {
          for (const interval of this.allowedTcpIntervals) {
            const port = Math.round(
              Math.random() * (interval[1] - interval[0]) + interval[0]
            );
            if (!this.tunnelStorage.findTcp(port)) {
              return { hostname: request.bindAddr, port };
            }
            attemptNum++;
          }
        }
        throw new Error("Unable to assign random TCP port to user");
      }

      // Check if port is in allowed intervals
      if (
        !this.allowedTcpIntervals.find(
          ([start, end]) => port >= start && port <= end
        )
      ) {
        throw new Error(`Port ${port} is not allowed`);
      }

      // Check if port is already used for tunneling
      if (this.tunnelStorage.findTcp(port)) {
        throw new Error(`Port ${port} is in use`);
      }

      // double-check if port is free by attempting to open tcp server on it
      await new Promise((resolve, reject) => {
        const checkServer = createServer();
        checkServer.once("error", () =>
          reject(`Unable to start TCP server on port ${request.bindPort}`)
        );
        checkServer.listen(request.bindPort, () =>
          checkServer.close(() => resolve(true))
        );
      });

      return { hostname: request.bindAddr, port: request.bindPort };
    }

    const expectedAddress = this.parseAddressRequest(request.bindAddr);
    if (expectedAddress === false) {
      throw new Error(
        `Unable to define expected address for ${request.bindAddr}`
      );
    }

    // Check user expected hostname
    if (expectedAddress.subdomain !== "") {
      if (
        this.tunnelStorage.findHttp(
          this.createHostname(expectedAddress.subdomain)
        )
      ) {
        throw new Error(
          `Unable to provide expected address for ${expectedAddress}`
        );
      }

      return { hostname: expectedAddress.hostname, port: 80 };
    }

    // Assign generated subdomain for tunnel
    let suggestedSubdomain = "";
    for (let attemptNumber = 0; attemptNumber < 10; attemptNumber++) {
      if (attemptNumber === 0) {
        // SSH client username as a 1st subdomain attempt
        suggestedSubdomain = request.username;
      } else if (attemptNumber >= 1 && attemptNumber <= 3) {
        // 2nd - 4th attempts - username with 3 random alphanum
        suggestedSubdomain = request.username + "-" + generateAlphaNum(3);
      } else if (attemptNumber >= 4 && attemptNumber <= 7) {
        // 5th - 8th attempts - username with 7 random alphanum
        suggestedSubdomain = request.username + "-" + generateAlphaNum(7);
      } else {
        // 9th - 10th attempts - random string with length 12
        suggestedSubdomain = generateAlphaNum(12);
      }
      const suggestedHostname = this.createHostname(suggestedSubdomain);

      if (!this.tunnelStorage.findHttp(suggestedHostname)) {
        return { hostname: suggestedHostname, port: 80 };
      }
    }

    throw new Error("Unable to suggest domain for connection");
  }

  private parseAddressRequest(address: string): AddressRequest | false {
    // If no address was provided by user, it will be set as localhost by OpenSSH
    if (
      !address ||
      address === "127.0.0.1" ||
      address === "localhost" ||
      address === this.domainName
    ) {
      return { subdomain: "", hostname: this.domainName };
    }

    if (!address.endsWith(this.domainName)) {
      return false;
    }

    const subdomain = address.substring(
      0,
      address.lastIndexOf(this.domainName) - 1
    );

    return {
      subdomain: subdomain,
      hostname: this.createHostname(subdomain),
    };
  }

  private createHostname(subdomain: string): string {
    return subdomain + "." + this.domainName;
  }
}
