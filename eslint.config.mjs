import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Repository pattern guard: vendor SDKs may only be used inside their infrastructure adapter.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/infrastructure/supabase/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@supabase/*"],
              message: "Use the repositories from @/repositories via the containers in src/infrastructure instead.",
            },
            {
              group: ["@/infrastructure/supabase/*", "@/infrastructure/memory/*"],
              message: "Depend on repository interfaces; only the containers may import concrete providers.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/infrastructure/container.*.ts", "src/infrastructure/**/*.test.ts", "tests/**"],
    rules: { "no-restricted-imports": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "src/infrastructure/supabase/database.types.ts"]),
]);

export default eslintConfig;
