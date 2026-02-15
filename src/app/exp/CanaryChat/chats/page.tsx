"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Chat } from "@prismaClient";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { useRouter } from "next/navigation";
import { useSession } from "@/configs/authClient";

interface ChatWithLatestMessage extends Chat {
  latestMessage: {
    id: string;
    createdAt: Date;
    text: string;
  } | null;
}

export default function ChatsPage() {
  const [chats, setChats] = useState<ChatWithLatestMessage[]>();
  const router = useRouter();
  const { data: session } = useSession();

  const getMessages = async () => {
    const res = await fetch('/api/exp/CanaryChat/chats');
    const resBody = await res.json();

    if (!res.ok) {
      console.error('Failed to fetch chats', resBody);
      return;
    }

    setChats(resBody.data);
  };

  useEffect(() => {
    if (!session) return;

    getMessages();
  }, [session]);

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Chats</h1>
        <Button
          color="primary"
          onPress={() => router.push("/exp/CanaryChat/chats/new")}
          startContent={<span className="material-symbols-outlined">add</span>}
        >
          New Chat
        </Button>
      </div>

      {chats === undefined ? (
        <div className="text-center py-20 text-foreground/50">Loading chats…</div>
      ) : chats.length === 0 ? (
        <div className="border-dashed border-2 border-foreground/50 rounded-lg p-8 text-center">
          <p className="mb-4 text-lg">No chats found.</p>
          <p className="mb-6 text-sm text-foreground/30">Create a new chat to get started — choose a scenario, language, and level.</p>
          <Link href="/exp/CanaryChat/chats/new">
            <Button>Create New Chat</Button>
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {chats.map((chat: ChatWithLatestMessage) => (
            <Card key={chat.id} isPressable className="w-full p-2" onPress={() => router.push(`/exp/CanaryChat/chats/${chat.id}`)}>
              <CardHeader className="flex items-center justify-between">
                <div className="flex flex-col items-start">
                  <h2 className="text-lg font-medium">{chat.title || "Untitled Chat"}</h2>
                  <div className="text-sm text-foreground/50">{chat.language} • {chat.level}</div>
                </div>
                <span className="text-sm text-foreground/50">{new Date(chat.latestMessage?.createdAt || chat.createdAt).toLocaleString()}</span>
              </CardHeader>
              <CardBody className="pt-0">
                {chat.latestMessage && (
                  <div className="text-sm text-foreground/80 mt-1">{chat.latestMessage.text.slice(0, 150)}{chat.latestMessage.text.length > 150 ? "…" : ""}</div>
                )}

                {!chat.latestMessage && (
                  <div className="text-sm text-foreground/30 mt-1">No messages yet. Start the conversation!</div>
                )}
              </CardBody>
            </Card>
          ))}
        </ul>
      )}
    </main>
  );
}
