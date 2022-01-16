import React from "react";
import { Tunnel } from "./components/Tunnel/Tunnel";

function App() {
  const host = window.location.hostname;

  return (
    <div className="App">
      <Tunnel url={window.location} />
    </div>
  );
}

export default App;
