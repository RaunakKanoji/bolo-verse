import typescript from "eslint-config-next/typescript";

// Reuse the already-pinned TypeScript rules without browser or Next runtime rules.
const config = [...typescript];
export default config;
