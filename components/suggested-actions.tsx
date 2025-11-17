"use client";

import { motion } from "framer-motion";
import { type Dispatch, memo, type SetStateAction } from "react";
import { Suggestion } from "./elements/suggestion";
import type { VisibilityType } from "./visibility-selector";

type SuggestedActionsProps = {
  chatId: string;
  setInput: Dispatch<SetStateAction<string>>;
  selectedVisibilityType: VisibilityType;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
};

function PureSuggestedActions({
  setInput,
  textareaRef,
}: SuggestedActionsProps) {
  const suggestedActions = [
    "What is the average home price in my area?",
    "Show me property value trends for the last 5 years",
    "What are the most recent sales in that area?",
    "What factors affect property values in my location?",
  ];

  return (
    <div
      className="grid w-full gap-2 sm:grid-cols-2"
      data-testid="suggested-actions"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          initial={{ opacity: 0, y: 20 }}
          key={suggestedAction}
          transition={{ delay: 0.05 * index }}
        >
          <Suggestion
            className="h-auto w-full whitespace-normal p-3 text-left"
            onClick={(suggestion) => {
              setInput(suggestion);
              // Focus the textarea after setting the input
              setTimeout(() => {
                textareaRef.current?.focus();
              }, 0);
            }}
            suggestion={suggestedAction}
          >
            {suggestedAction}
          </Suggestion>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }

    return true;
  }
);
