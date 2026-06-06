// Disable all console logs in production environment based on APP_ENV / VITE_APP_ENV
const appEnv = import.meta.env.APP_ENV || import.meta.env.VITE_APP_ENV;
if (appEnv === "production") {
  console.log = () => {};
  console.warn = () => {};
  console.info = () => {};
  console.debug = () => {};
  console.error = () => {};
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootEl = document.getElementById("root")!;
createRoot(rootEl).render(<App />);

// Remove splash screen AFTER React has committed its first render to the DOM.
// We use double-rAF: the first frame React commits, the second frame browser paints.
// This prevents a white flash between splash removal and React content appearing.
const splash = document.getElementById("pwa-splash");
if (splash) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      splash.style.transition = "opacity 0.4s ease";
      splash.style.opacity = "0";
      setTimeout(() => {
        if (splash.parentNode) splash.parentNode.removeChild(splash);
      }, 450);
    });
  });
}
