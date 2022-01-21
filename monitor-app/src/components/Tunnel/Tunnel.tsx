import React, { useEffect } from "react";
import styles from "./Tunnel.module.scss";
import { createHttpParserFromWs } from "../../common/traffic";

export const Tunnel = (props: { url: string }) => {
  function newEvent(data: string, color?: string) {
    const el = document.createElement("div");
    el.style.border = "2px solid black";
    el.style.padding = "5px";
    if (color !== undefined) {
      el.style.borderColor = color;
    }
    el.innerText = data;
    // @ts-ignore
    document.getElementById("tunnel-data").appendChild(el);
  }

  useEffect(() => {
    let socket = new WebSocket("ws://monitor.localhost/traffic");

    const parser = createHttpParserFromWs(socket);
    parser.on("request", (request) => {
      request.on("data", (chunk) => {
        console.log("<- data");
        newEvent(new TextDecoder().decode(chunk), "lightgreen");
      });
      request.on("close", () => {
        console.log("<- finished");
      });

      request.on("response", (response) => {
        response.on("data", (chunk) => {
          console.log("-> data");
          newEvent(new TextDecoder().decode(chunk), "indianred");
        });
        response.on("close", () => {
          console.log("-> finished");
        });

        newEvent(JSON.stringify(response), "red");
      });

      newEvent(JSON.stringify(request), "green");
    });
  });

  return (
    <div className={styles.Tunnel}>
      Tunnel for <b>{JSON.stringify(props.url)}</b>
      <div id="tunnel-data"></div>
    </div>
  );
};
