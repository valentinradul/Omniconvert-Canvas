
// Set environment variables for local development
// This file is not used in production
import { config } from "https://deno.land/x/dotenv/mod.ts";

// Load .env file from the root of the project
config({ export: true });

// Set PUBLIC_APP_URL if not already set
if (!Deno.env.get("PUBLIC_APP_URL")) {
  Deno.env.set("PUBLIC_APP_URL", "http://localhost:5173");
}

console.log("Environment variables set for local development");
