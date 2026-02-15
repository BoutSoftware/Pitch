import { DotenvPopulateInput, parse, populate } from "dotenv";

export default function loadEnvVars() {
    if (process.env.ENV_VARS_LOADED) return;

    const envVars = process.env.ENV_VARS;

    if (envVars) {
        console.log("Parsing environment variables from ENV_VARS");

        // Validate if envVars is a valid JSON string
        try {
            const parsedEnvVars = JSON.parse(envVars);
            populate(process.env as DotenvPopulateInput, parsedEnvVars);
        } catch {
            console.log("Failed to parse ENV_VARS as JSON:");
            console.log("Trying to parse as KEY=VALUE format");

            const parsedEnvVars = parse(envVars);

            populate(process.env as DotenvPopulateInput, parsedEnvVars);
        }
    }

    process.env.ENV_VARS_LOADED = "true";
}