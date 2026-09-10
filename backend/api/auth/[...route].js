import { handle } from "@hono/node-server/vercel";
import { createApp } from "../../dist/src/presentation/app.js";

const app = createApp();

export default handle(app);
