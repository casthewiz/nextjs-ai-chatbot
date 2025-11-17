import OpenAI from "openai";
import { ChatSDKError } from "@/lib/errors";

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

    const response = await openai.responses.create({
      prompt: {
        id: "pmpt_691b97cbd27c8193bd9bf14df71874050cce839fd2cd0152",
        version: "2",
        variables: {
          city: city || "",
          state: state || "",
        },
      },
      input: input ? [input] : [],
      reasoning: {
        summary: "auto",
      },
      store: true,
      include: [
        "reasoning.encrypted_content",
        "web_search_call.action.sources",
      ],
    });

    return Response.json(response, { status: 200 });
  } catch (error) {
    console.error("Error calling OpenAI prompt API:", error);

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    return new ChatSDKError("offline:chat").toResponse();
  }
}
