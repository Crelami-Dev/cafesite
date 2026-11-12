import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Node utility scripts with .cjs extensions intentionally use CommonJS.
  { files: ["scripts/**/*.cjs"], rules: { "@typescript-eslint/no-require-imports": "off" } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".vercel/**",
    "server/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored design tooling and its unchanged browser assets are not app source.
    ".agents/skills/**",
    ".claude/**",
    ".data/**",
    ".taste-skill/**",
    "public/assets/**",
  ]),
]);

export default eslintConfig;
