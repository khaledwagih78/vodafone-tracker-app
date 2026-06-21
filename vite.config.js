import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/vodafone-tracker-app/",
  plugins: [react()],
});
