import { defineConfig } from "eslint/config";
import next from "eslint-config-next";

export default defineConfig([{
    ignores: [
        ".next/**",
        ".vercel/**",
        "coverage/**",
        "node_modules/**",
        "tsconfig.tsbuildinfo",
    ],
    extends: [...next],
}]);
