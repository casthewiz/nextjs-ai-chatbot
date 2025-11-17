"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import {
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { useLocalStorage, useWindowSize } from "usehooks-ts";
import type { ChatMessage } from "@/lib/types";
import type { ListingsResponse } from "@/lib/types/listings";
import type { OpenAIResponse } from "@/lib/types/openai-response";
import { cn } from "@/lib/utils";
import { PromptInput, PromptInputTextarea } from "./elements/prompt-input";
import { SuggestedActions } from "./suggested-actions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { VisibilityType } from "./visibility-selector";

// Regex pattern for matching JSON objects with listings (defined at top level for performance)
const LISTINGS_JSON_PATTERN = /\{[\s\S]*"listings"[\s\S]*\}/;

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  setStatus,
  messages,
  setMessages,
  className,
  selectedVisibilityType,
}: {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>["status"];
  setStatus: Dispatch<SetStateAction<UseChatHelpers<ChatMessage>["status"]>>;
  messages: UIMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  className?: string;
  selectedVisibilityType: VisibilityType;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, [adjustHeight]);

  const resetHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }
  }, []);

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    "input",
    ""
  );
  const [zipCodeCity, setZipCodeCity] = useState("");
  const [state, setState] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue: string = domValue || localStorageInput || "";
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjustHeight, localStorageInput, setInput]);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const submitForm = useCallback(async () => {
    // Prevent multiple submissions
    if (isSubmitting || status !== "ready") {
      return;
    }

    setIsSubmitting(true);
    setStatus("submitted");

    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    window.history.pushState({}, "", `/chat/${chatId}`);

    // Build the message text with location info if provided
    let messageText = input;
    if (zipCodeCity || state) {
      const locationParts: string[] = [];
      if (zipCodeCity) {
        locationParts.push(zipCodeCity);
      }
      if (state) {
        locationParts.push(state);
      }
      const locationInfo = `Location: ${locationParts.join(", ")}`;
      messageText = messageText
        ? `${locationInfo}\n\n${messageText}`
        : locationInfo;
    }

    try {
      // Add user message first
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        parts: [
          {
            type: "text",
            text: messageText,
          },
        ],
      };

      setMessages((prev) => [...prev, userMessage]);

      // Call OpenAI prompt API
      const response = await fetch("/api/openai-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          city: zipCodeCity,
          state,
          input: input || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from OpenAI");
      }

      const data = (await response.json()) as OpenAIResponse;

      // Extract the response text from the OpenAI response
      // The response has output_text field which contains the final text
      // Fallback to extracting from output array if output_text is not available
      let responseText: string | undefined = data.output_text;

      if (!responseText && data.output) {
        // Find the message output item and extract text from content
        const messageOutput = data.output.find(
          (
            item
          ): item is Extract<
            OpenAIResponse["output"][number],
            { type: "message" }
          > => item.type === "message"
        );
        if (messageOutput?.content) {
          const textContent = messageOutput.content.find(
            (content) => content.type === "output_text"
          );
          if (textContent?.text) {
            responseText = textContent.text;
          }
        }
      }

      // Final fallback for backward compatibility
      if (!responseText) {
        const fallbackData = data as unknown as {
          choices?: Array<{ message?: { content?: string } }>;
          content?: string;
        };
        responseText =
          fallbackData.choices?.[0]?.message?.content ||
          fallbackData.content ||
          "No response text available";
      }

      // Ensure we have a valid response text
      if (
        !responseText ||
        typeof responseText !== "string" ||
        responseText.trim().length === 0
      ) {
        throw new Error("Empty or invalid response from OpenAI");
      }

      // Try to parse JSON from the response text
      let parsedData: ListingsResponse | null = null;
      let displayText = responseText;

      try {
        // First, try to parse the entire response as JSON
        try {
          const parsed = JSON.parse(responseText.trim()) as ListingsResponse;
          if (parsed.listings && Array.isArray(parsed.listings)) {
            parsedData = parsed;
            displayText = ""; // No text if entire response is JSON
          }
        } catch {
          // If entire response is not JSON, try to find JSON within the text
          const jsonMatch = responseText.match(LISTINGS_JSON_PATTERN);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]) as ListingsResponse;
            if (parsed.listings && Array.isArray(parsed.listings)) {
              parsedData = parsed;
              // Extract any text before/after the JSON for context
              const beforeJson = responseText
                .substring(0, jsonMatch.index ?? 0)
                .trim();
              const afterJson = responseText
                .substring((jsonMatch.index ?? 0) + jsonMatch[0].length)
                .trim();
              displayText = [beforeJson, afterJson]
                .filter(Boolean)
                .join("\n\n");
            }
          }
        }
      } catch (parseError) {
        // If JSON parsing fails, just use the text as-is
        console.debug("Could not parse JSON from response:", parseError);
      }

      // Build message parts
      const parts: ChatMessage["parts"] = [];

      // Add text part if there's any text content
      if (displayText && displayText.trim().length > 0) {
        parts.push({
          type: "text",
          text: displayText,
        });
      }

      // Add listings part if we have structured data
      if (parsedData?.listings && parsedData.listings.length > 0) {
        parts.push({
          type: "data-listings",
          data: parsedData,
        } as unknown as ChatMessage["parts"][number]);
      }

      // Fallback: if no parts were created, add the original text
      if (parts.length === 0) {
        parts.push({
          type: "text",
          text: responseText,
        });
      }

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        parts,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStatus("ready");
    } catch (error) {
      console.error("Error calling OpenAI prompt API:", error);
      toast.error("Failed to get response from OpenAI. Please try again.");
      // Remove the user message if the API call failed
      setMessages((prev) => prev.slice(0, -1));
      setStatus("ready");
    } finally {
      setLocalStorageInput("");
      resetHeight();
      setInput("");
      // Keep city and state values locked after first submission
      // Don't clear them: setZipCodeCity("") and setState("") removed

      if (width && width > 768) {
        textareaRef.current?.focus();
      }

      // Debounce: wait 500ms before allowing another submission
      debounceTimerRef.current = setTimeout(() => {
        setIsSubmitting(false);
        debounceTimerRef.current = null;
      }, 500);
    }
  }, [
    input,
    setInput,
    zipCodeCity,
    state,
    setLocalStorageInput,
    width,
    chatId,
    resetHeight,
    setMessages,
    setStatus,
    isSubmitting,
    status,
  ]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={cn("relative flex w-full flex-col gap-4", className)}>
      {messages.length === 0 && (
        <SuggestedActions
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
          setInput={setInput}
          textareaRef={textareaRef}
        />
      )}

      <PromptInput
        className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 shadow-xs transition-all duration-200 focus-within:border-border hover:border-muted-foreground/50"
        onSubmit={(event) => {
          event.preventDefault();
          if (status !== "ready") {
            toast.error("Please wait for the model to finish its response!");
          } else if (isSubmitting) {
            toast.error("Please wait before submitting again!");
          } else {
            submitForm();
          }
        }}
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              className="flex-1"
              disabled={messages.length > 0}
              name="zipCodeCity"
              onChange={(e) => {
                setZipCodeCity(e.target.value);
              }}
              placeholder="City"
              type="text"
              value={zipCodeCity}
            />
            <Input
              className="flex-1"
              disabled={messages.length > 0}
              name="state"
              onChange={(e) => {
                setState(e.target.value);
              }}
              placeholder="State"
              type="text"
              value={state}
            />
          </div>
          <PromptInputTextarea
            autoFocus
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            data-testid="multimodal-input"
            disableAutoResize={true}
            maxHeight={200}
            minHeight={80}
            onChange={handleInput}
            placeholder="Ask about property details (e.g., bedrooms, square footage, property type) for accurate pricing estimates"
            ref={textareaRef}
            rows={3}
            value={input}
          />
        </div>
        <div className="flex items-center justify-end">
          <Button
            className="rounded-md bg-muted px-6 py-2 text-foreground transition-colors duration-200 hover:bg-muted/90 disabled:bg-muted disabled:text-muted-foreground"
            data-testid="send-button"
            disabled={isSubmitting || status !== "ready"}
            type="submit"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </PromptInput>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) {
      return false;
    }
    if (prevProps.status !== nextProps.status) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }

    return true;
  }
);
