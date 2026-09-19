import { defineConfig } from "eslint/config";
import parser from "@typescript-eslint/parser";

export default defineConfig([
  { ignores: ["node_modules/**", ".expo/**"] },
  { files: ["src/**/*.{ts,tsx}"], languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } } },
]);
