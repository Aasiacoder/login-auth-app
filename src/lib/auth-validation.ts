import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, { message: "Email address is required." })
  .email({ message: "Enter a valid email address." })
  .max(255, { message: "Email must be under 255 characters." });

export const passwordSchema = z
  .string()
  .min(6, { message: "Password must be at least 6 characters." })
  .max(72, { message: "Password must be under 72 characters." });

export function validateEmail(value: string): string {
  const result = emailSchema.safeParse(value);
  return result.success ? "" : (result.error.issues[0]?.message ?? "Invalid email.");
}

export function validatePassword(value: string): string {
  const result = passwordSchema.safeParse(value);
  return result.success ? "" : (result.error.issues[0]?.message ?? "Invalid password.");
}

/** Turn backend auth errors into plain, friendly guidance. */
export function friendlyAuthError(message: string | undefined): string {
  const text = (message ?? "").toLowerCase();
  if (text.includes("invalid login credentials")) return "That email and password don't match. Please try again.";
  if (text.includes("email not confirmed")) return "Please confirm your email first — check your inbox for the confirmation link.";
  if (text.includes("already registered") || text.includes("already been registered")) return "An account with this email already exists. Try logging in instead.";
  if (text.includes("rate limit") || text.includes("too many")) return "Too many attempts. Please wait a minute and try again.";
  if (text.includes("password should be")) return "Password must be at least 6 characters.";
  if (text.includes("pwned") || text.includes("compromised")) return "This password appeared in a data breach. Please choose a different one.";
  if (text.includes("failed to fetch") || text.includes("network")) return "Network problem. Check your connection and try again.";
  return message || "Something went wrong. Please try again.";
}
