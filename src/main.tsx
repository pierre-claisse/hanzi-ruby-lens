import "@fontsource/cactus-classical-serif";
import "@fontsource/chocolate-classical-sans";
import "@fontsource/lxgw-wenkai-tc";
import "@fontsource-variable/chiron-hei-hk";
import "@fontsource/huninn";
import "chiron-sung-hk-webfont/css/vf.css";

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./auth";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
