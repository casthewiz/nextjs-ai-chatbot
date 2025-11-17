"use client";

import { useEffect, useState } from "react";
import { LoaderIcon } from "./icons";
import { cn } from "@/lib/utils";

const LOADING_MESSAGES = [
  "Consulting the AI oracle...",
  "Asking ChatGPT for advice...",
  "Training neural networks (just kidding)...",
  "Counting to infinity...",
  "Teaching AI to count (it's harder than you think)...",
  "Convincing the AI it's not Skynet...",
  "Waiting for the AI to finish its coffee break...",
  "The AI is thinking... probably about pizza...",
  "Calculating the meaning of life...",
  "AI is processing... please don't unplug it...",
  "Asking the AI nicely to respond...",
  "The AI is reading your message... slowly...",
  "Training a hamster to run the AI...",
  "Waiting for the AI to finish its existential crisis...",
  "The AI is thinking... this might take a while...",
  "Consulting the AI crystal ball...",
  "The AI is processing... and judging your question...",
  "Waiting for the AI to stop procrastinating...",
  "The AI is working... probably...",
  "Asking the AI to hurry up...",
];

type AILoadingSpinnerProps = {
  className?: string;
  messageInterval?: number;
};

export function AILoadingSpinner({
  className,
  messageInterval = 3000,
}: AILoadingSpinnerProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, messageInterval);

    return () => clearInterval(interval);
  }, [messageInterval]);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-8",
        className
      )}
    >
      <div className="relative">
        <div className="animate-spin text-muted-foreground">
          <LoaderIcon size={32} />
        </div>
      </div>
      <p className="text-muted-foreground text-sm animate-pulse">
        {LOADING_MESSAGES[currentMessageIndex]}
      </p>
    </div>
  );
}

