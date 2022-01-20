import React from "react";
import { Tunnel } from "./components/Tunnel/Tunnel";

function App() {
  const host = window.location.hostname;

  return (
    <div className="App">
      <Tunnel url={host} />
    </div>
  );
}

export default App;
