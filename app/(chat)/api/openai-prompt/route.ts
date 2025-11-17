import OpenAI from "openai";
import { ChatSDKError } from "@/lib/errors";
import type { OpenAIResponse } from "@/lib/types/openai-response";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { city, state, input } = body;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new ChatSDKError("bad_request:api").toResponse();
    }

    const openai = new OpenAI({
      apiKey,
    });

    const requestPayload = {
      prompt: {
        id: "pmpt_691b97cbd27c8193bd9bf14df71874050cce839fd2cd0152",
        version: "8",
        variables: {
          city: city || "",
          state: state || "",
        },
      },
      input: input ? [{ type: "message", role: "user", content: input }] : [],
      reasoning: {
        summary: "auto",
      },
      store: true,
      include: ["reasoning.encrypted_content"],
    };

    console.log("[OpenAI Request] Making request to OpenAI API:", {
      promptId: requestPayload.prompt.id,
      promptVersion: requestPayload.prompt.version,
      variables: requestPayload.prompt.variables,
      inputLength: requestPayload.input.length,
      hasInput: requestPayload.input.length > 0,
      timestamp: new Date().toISOString(),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = (await openai.responses.create(
      requestPayload as any
    )) as unknown as OpenAIResponse;

    console.log("[OpenAI Response] Received response from OpenAI API:", {
      responseId: response.id,
      status: response.status,
      model: response.model,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.total_tokens,
        cachedTokens: response.usage.input_tokens_details.cached_tokens,
        reasoningTokens: response.usage.output_tokens_details.reasoning_tokens,
      },
      hasOutputText: !!response.output_text,
      outputLength: response.output?.length || 0,
      timestamp: new Date().toISOString(),
    });

    // Validate response structure
    if (
      !response.output_text &&
      (!response.output || response.output.length === 0)
    ) {
      throw new Error("Invalid response structure from OpenAI");
    }

    return Response.json(response, { status: 200 });
  } catch (error) {
    console.error("Error calling OpenAI prompt API:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    return new ChatSDKError("offline:chat").toResponse();
  }
}
