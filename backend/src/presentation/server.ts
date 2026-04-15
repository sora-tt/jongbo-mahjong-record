import { serve } from "@hono/node-server";
import { createApp } from "@/presentation/app.js";

const port = Number.parseInt(process.env.PORT ?? "8080", 10);
const app = createApp();

serve({
  fetch: app.fetch,
  port,
});

console.log(`API server is running at http://localhost:${port}`);
