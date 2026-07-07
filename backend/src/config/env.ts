import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  FRONTEND_ORIGIN: z.string().url().default("http://localhost:5174"),
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/devpulse"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_ACCESS_SECRET: z.string().default("devpulse-access-secret-change-me"),
  JWT_REFRESH_SECRET: z.string().default("devpulse-refresh-secret-change-me"),
  TOKEN_ENCRYPTION_KEY: z.string().default("devpulse-local-encryption-key-32"),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().url().default("http://localhost:4000/api/v1/auth/github/callback"),
  GITHUB_WEBHOOK_SECRET: z.string().default("devpulse-webhook-secret"),
  AI_PROVIDER: z.enum(["gemini", "openai", "ollama"]).default("gemini"),
  AI_MODEL: z.string().default("gemini-2.5-flash"),
  AI_BASE_URL: z.string().optional(),
  AI_API_KEY: z.string().optional(),
  
});

export const env = envSchema.parse(process.env);
