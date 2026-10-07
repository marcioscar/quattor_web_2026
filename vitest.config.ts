import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Separado do vite.config.ts: o plugin do React Router não roda dentro do vitest.
export default defineConfig({
	plugins: [tsconfigPaths()],
	test: { include: ["app/**/*.test.ts"] },
});
