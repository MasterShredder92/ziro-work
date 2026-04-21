import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
export default defineConfig({
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
            "@data": resolve(__dirname, "lib/data"),
            "server-only": resolve(__dirname, "tests/stubs/server-only.ts"),
        },
    },
    test: {
        environment: "node",
        include: ["tests/**/*.test.{ts,tsx}"],
        globals: true,
        setupFiles: ["tests/setup/env.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "lcov"],
        },
    },
});
