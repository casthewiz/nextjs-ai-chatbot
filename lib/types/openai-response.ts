export type OpenAIResponseOutputItem =
  | {
      id: string;
      type: "reasoning";
      encrypted_content?: string;
      summary?: Array<{
        type: "summary_text";
        text: string;
      }>;
    }
  | {
      id: string;
      type: "message";
      status: string;
      content: Array<{
        type: "output_text";
        text: string;
        annotations?: unknown[];
        logprobs?: unknown[];
      }>;
      role: "assistant" | "user" | "developer";
    };

export type OpenAIResponse = {
  id: string;
  object: "response";
  created_at: number;
  status: "completed" | "in_progress" | "failed";
  background: boolean;
  billing?: {
    payer: string;
  };
  error: unknown | null;
  incomplete_details: unknown | null;
  instructions: Array<{
    type: "message";
    content: Array<{
      type: "input_text";
      text: string;
    }>;
    role: "developer" | "user";
  }>;
  max_output_tokens: number | null;
  max_tool_calls: number | null;
  model: string;
  output: OpenAIResponseOutputItem[];
  parallel_tool_calls: boolean;
  previous_response_id: string | null;
  prompt: {
    id: string;
    variables: Record<string, { type: "input_text"; text: string }>;
    version: string;
  };
  prompt_cache_key: string | null;
  prompt_cache_retention: number | null;
  reasoning?: {
    effort: string;
    summary: string;
  };
  safety_identifier: unknown | null;
  service_tier: string;
  store: boolean;
  temperature: number;
  text: {
    format: {
      type: "text";
    };
    verbosity: string;
  };
  tool_choice: string;
  tools: unknown[];
  top_logprobs: number;
  top_p: number;
  truncation: string;
  usage: {
    input_tokens: number;
    input_tokens_details: {
      cached_tokens: number;
    };
    output_tokens: number;
    output_tokens_details: {
      reasoning_tokens: number;
    };
    total_tokens: number;
  };
  user: unknown | null;
  metadata: Record<string, unknown>;
  output_text: string;
};

