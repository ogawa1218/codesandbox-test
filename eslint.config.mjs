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
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/supabase/admin",
              message:
                "admin (service-role) は Server Action / Route Handler 内のみで使用してください。",
            },
          ],
          patterns: [
            {
              group: ["**/lib/supabase/admin"],
              message:
                "service-role を含むモジュールは server-only ファイル経由のみで読み込んでください。",
            },
          ],
        },
      ],
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
