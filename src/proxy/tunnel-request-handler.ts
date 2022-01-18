import { TunnelStorage } from "./tunnel-storage";
import { TunnelRequest } from "../ssh/server";
import { config } from "../config";
import { generateAlphaNum } from "../helper/generator";

type AddressRequest = {
  subdomain: string;
  hostname: string;
};

export class TunnelRequestHandler {
  private readonly domainName: any;

  constructor(private tunnelStorage: TunnelStorage) {
    this.domainName = config.domainName;
  }

  /**
   * Return accepted/adjusted tunnel address and port or false if tunnel can not be accepted
   */
  handle(request: TunnelRequest): { hostname: string; port: number } | false {
    if (request.bindPort !== 80) {
      if (this.tunnelStorage.findTcp(request.bindPort)) {
        return false;
      }
      return { hostname: request.bindAddr, port: request.bindPort };
    }

    const expectedAddress = this.parseAddressRequest(request.bindAddr);
    if (expectedAddress === false) {
      return false;
    }

    // Check user expected hostname
    if (expectedAddress.subdomain !== "") {
      if (
        this.tunnelStorage.findHttp(
          this.createHostname(expectedAddress.subdomain)
        )
      ) {
        return false;
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

    console.error("Unable to suggest domain for connection");
    return false;
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
