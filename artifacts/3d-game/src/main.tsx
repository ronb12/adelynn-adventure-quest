import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Suppress deprecation warnings that originate inside bundled library code
// (THREE.Clock → THREE.Timer migration is on the R3F library, not our code)
const _warn = console.warn.bind(console);
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('THREE.Clock')) return;
  _warn(...args);
};

createRoot(document.getElementById("root")!).render(<App />);
