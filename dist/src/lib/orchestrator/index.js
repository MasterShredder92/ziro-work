// Re-export from new modular routing services
// Kept for backward compatibility — new code should import from lib/routing/* directly
export { classifyTask } from "@/lib/routing/classifyTask";
export { routeTask } from "@/lib/routing/routeTask";
export { composeSystemPrompt as composePrompt, estimateTokens } from "@/lib/routing/composeSystemPrompt";
export { writeStarReview as saveReview, generateReview } from "@/lib/reviews/writeStarReview";
export { validateRuntime } from "@/lib/routing/selectRuntime";
