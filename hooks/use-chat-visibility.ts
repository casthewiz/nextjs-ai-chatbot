"use client";

import { useMemo } from "react";
import useSWR from "swr";
import type { VisibilityType } from "@/components/visibility-selector";

export function useChatVisibility({
  chatId,
  initialVisibilityType,
}: {
  chatId: string;
  initialVisibilityType: VisibilityType;
}) {
  const { data: localVisibility } = useSWR(
    `${chatId}-visibility`,
    null,
    {
      fallbackData: initialVisibilityType,
    }
  );

  const visibilityType = useMemo(() => {
    return localVisibility ?? initialVisibilityType;
  }, [localVisibility, initialVisibilityType]);

  return { visibilityType };
}
