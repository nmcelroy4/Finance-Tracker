import * as dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load environment variables
dotenv.config({ path: ".env.local" });

export default defineConfig({
	schema: ["./drizzle/schema.ts", "./src/types/enum.ts"],
	out: "./drizzle/migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
});
