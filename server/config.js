import path from "path";
const __dirname = path.resolve();
import { config } from "dotenv";
config({ path: path.join(__dirname, "./.env.local") });
