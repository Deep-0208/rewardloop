import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "graphify-out/**",
    "Documents/**",
    "Development/**",
    ".venv/**",
    "claude-code-security-review/**",
    "*.js",
  ]),
  {
    rules: {
      "no-console": "warn",
    },
  },
]);

export default eslintConfig;
