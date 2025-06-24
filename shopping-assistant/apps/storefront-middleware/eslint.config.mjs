import { concat, ecma, typescript } from "@vue-storefront/eslint-config";
import gitignore from "eslint-config-flat-gitignore";

export default concat(
  gitignore(),
  ecma(),
  typescript(
    {},
    {
      files: ["**/*.ts"],
      rules: {
        "@typescript-eslint/no-empty-object-type": "off",
        "@typescript-eslint/no-unused-vars": "warn",
        "@typescript-eslint/consistent-type-imports": "warn",
      },
    },
  ),
);
