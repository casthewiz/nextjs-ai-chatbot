import { cookies } from "next/headers";

import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import type { ChatMessage } from "@/lib/types";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get("chat-model");
  const chatModel = chatModelFromCookie?.value ?? DEFAULT_CHAT_MODEL;

  return (
    <>
      <Chat
        autoResume={false}
        id={id}
        initialChatModel={chatModel}
        initialMessages={[]}
        initialVisibilityType="private"
        isReadonly={false}
      />
      <DataStreamHandler />
    </>
  );
}
