import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
    },
  },
  {
    ignores: ["dist/", ".medusa/", "node_modules/"],
  },
];
