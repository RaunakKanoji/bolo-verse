import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "./typescript.mjs";

const config = [...coreWebVitals, ...typescript];
export default config;
