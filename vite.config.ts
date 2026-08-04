import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000, // Changed to 3000 as requested
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split rarely-changing vendor code into its own chunks so a deploy
        // that only touches app code does not invalidate the browser cache
        // for all of React and Radix.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id)) {
            return "react-vendor";
          }
          if (id.includes("@radix-ui")) return "radix";
          // recharts is deliberately left unassigned: it is only reachable from
          // the lazy admin routes, and naming it here would promote it into the
          // entry's static import graph.
        },
      },
    },
  },
}));
