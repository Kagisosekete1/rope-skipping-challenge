import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./cartoon.css";

createRoot(document.getElementById("root")).render(<App />);

// In development remove only this application's old worker; production uses
// a build-generated app-shell cache with locally bundled assets.
if ("serviceWorker" in navigator) {
  const scope = new URL(import.meta.env.BASE_URL, location.href).href;
  if (import.meta.env.PROD)
    window.addEventListener("load", () =>
      navigator.serviceWorker
        .register(import.meta.env.BASE_URL + "sw.js")
        .catch(() => {}),
    );
  else
    navigator.serviceWorker
      .getRegistrations()
      .then((rs) =>
        rs.filter((r) => r.scope === scope).forEach((r) => r.unregister()),
      );
}
