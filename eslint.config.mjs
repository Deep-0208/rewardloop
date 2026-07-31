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
    "claude-code-security-review/**",
    "dump-footer.js",
    "supabase/functions/**",
    "*.js",
  ]),
  {
    rules: {
      "no-console": "warn",
    },
  },
]);

export default eslintConfig;
