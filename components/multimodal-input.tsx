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
import { cn } from "@/lib/utils";
import { PromptInput, PromptInputTextarea } from "./elements/prompt-input";
import { SuggestedActions } from "./suggested-actions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { VisibilityType } from "./visibility-selector";

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  messages,
  setMessages,
  sendMessage,
  className,
  selectedVisibilityType,
}: {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>["status"];
  messages: UIMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
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

      const data = await response.json();

      // Extract the response text from the OpenAI response
      // The structure may vary, so we'll handle it generically
      const responseText =
        data.choices?.[0]?.message?.content ||
        data.content ||
        JSON.stringify(data, null, 2);

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        parts: [
          {
            type: "text",
            text: responseText,
          },
        ],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error calling OpenAI prompt API:", error);
      toast.error("Failed to get response from OpenAI. Please try again.");
      // Remove the user message if the API call failed
      setMessages((prev) => prev.slice(0, -1));
    }

    setLocalStorageInput("");
    resetHeight();
    setInput("");
    setZipCodeCity("");
    setState("");

    if (width && width > 768) {
      textareaRef.current?.focus();
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
  ]);

  return (
    <div className={cn("relative flex w-full flex-col gap-4", className)}>
      {messages.length === 0 && (
        <SuggestedActions
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
          sendMessage={sendMessage}
        />
      )}

      <PromptInput
        className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 shadow-xs transition-all duration-200 focus-within:border-border hover:border-muted-foreground/50"
        onSubmit={(event) => {
          event.preventDefault();
          if (status !== "ready") {
            toast.error("Please wait for the model to finish its response!");
          } else {
            submitForm();
          }
        }}
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              className="flex-1"
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
            type="submit"
          >
            Submit
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
