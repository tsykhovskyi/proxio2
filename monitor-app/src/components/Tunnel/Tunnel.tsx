import React from "react";
import styles from "./Tunnel.module.scss";

export const Tunnel = (props: { url: object }) => {
  function newEvent(data: string, color?: string) {
    console.log("newww event");
    const el = document.createElement("div");
    el.style.border = "1px solid black";
    el.style.padding = "5px";
    if (color !== undefined) {
      el.style.borderColor = color;
    }
    el.innerText = data;
    // @ts-ignore
    document.getElementById("tunnel-data").appendChild(el);
  }

  function bufToHex(buf: Uint8Array) {
    let res = "";
    for (const byte of buf) {
      res += byte.toString(16).padStart(2, "0");
    }

    return res;
  }

  let socket = new WebSocket("wss://monitor.localhost");

  socket.onopen = (ev) => {
    console.log("Opened", ev);
  };

  socket.onmessage = (ev) => {
    if (ev.data instanceof Blob) {
      ev.data.arrayBuffer().then((buf) => {
        const dv = new DataView(buf);
        const bufUint8Array = new Uint8Array(buf);

        const direction = dv.getUint8(0) === 0 ? "inbound" : "outbound";
        const packetId = bufToHex(bufUint8Array.slice(1, 9));
        const chunkNum = dv.getUint32(9);
        const time = dv.getUint32(13);
        const payload = bufUint8Array.slice(17).buffer;

        const dec = new TextDecoder();
        const chunk = dec.decode(payload);

        const result = [
          "Direction: " + direction,
          "Packet id: " + packetId,
          "Chunk number: " + chunkNum,
          "Time: " + time,
          "\n",
          chunk,
        ];
        newEvent(result.join("\n"), "darkgreen");
      });
    } else {
      newEvent(ev.data);
    }
  };

  socket.onclose = (ev) => {
    console.log("Closed");
  };

  return (
    <div className={styles.Tunnel}>
      Tunnel for <b>{JSON.stringify(props.url)}</b>
      <div id="tunnel-data"></div>
    </div>
  );
};
