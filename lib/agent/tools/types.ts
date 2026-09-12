import type { AgentTraceToolCall } from "@/lib/analytics/posthog";

export type ToolTraceSink = (event: AgentTraceToolCall) => void;
