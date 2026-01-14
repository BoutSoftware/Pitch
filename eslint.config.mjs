import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // General rules.
  {
    rules: {
      // "no-unused-vars": "warn", // Already handled by TypeScript eslint plugin.
      "react/react-in-jsx-scope": "off", // Disable the need to import React in scope.
      "react-hooks/set-state-in-effect": "off", // Disable warning for setting state in useEffect.
      "react-hooks/exhaustive-deps": "off", // Disable warning for missing dependencies in useEffect.
      "semi": "warn" // Warn on missing semicolons.
    }
  }
]);

export default eslintConfig;
