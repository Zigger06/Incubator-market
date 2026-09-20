import tseslint from "typescript-eslint";
import hooks from "eslint-plugin-react-hooks";
export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "supabase/functions/**"] },
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "react-hooks": hooks },
    rules: {
      ...hooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
);
