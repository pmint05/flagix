import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [
		devtools(),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
			routesDirectory: "src/routes",
			routeFileExtensions: ["ts", "tsx"],
		}),
	],
});

export default config;
