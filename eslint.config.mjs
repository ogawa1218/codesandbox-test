import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "react/no-danger": "error",
      "@typescript-eslint/no-explicit-any": "error",
      // service-role の混入は lib/supabase/admin.ts 冒頭の
      // `import "server-only"` で build-time に防ぐ。
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.property.name='getSession'][callee.object.property.name='auth']",
          message:
            "getSession() は禁止です。改ざん検知のため getUser() を使ってください。",
        },
      ],
    },
  },
];

export default eslintConfig;
