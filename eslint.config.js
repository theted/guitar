import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      // shadcn/ui generated components — not authored here
      "src/components/ui/**",
    ],
  },

  js.configs.recommended,

  ...tseslint.configs.recommended,

  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Empty catch blocks are intentional in Web Audio API teardown paths
      "no-empty": ["error", { allowEmptyCatch: true }],
      // Allow explicit `any` where needed (e.g. browser API quirks)
      "@typescript-eslint/no-explicit-any": "warn",
      // Unused vars as warnings; underscore-prefix silences them
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  // Web Worker file — runs in worker context (has self, setInterval, etc.)
  {
    files: ["src/schedulerWorker.js"],
    languageOptions: {
      globals: {
        self: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
      },
    },
  }
);
