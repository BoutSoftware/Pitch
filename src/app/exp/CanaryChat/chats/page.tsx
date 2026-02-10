"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Chat } from "@prismaClient";
import { Button } from "@heroui/button";

export default function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>();

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
    getMessages();
  }, []);

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Chats</h1>
        <Link href="/exp/CanaryChat/chats/new">
          <Button>New Chat</Button>
        </Link>
      </div>

      {chats === undefined ? (
        <div className="text-center py-20 text-gray-500">Loading chats…</div>
      ) : chats.length === 0 ? (
        <div className="border-dashed border-2 border-gray-200 rounded-lg p-8 text-center">
          <p className="mb-4 text-lg">No chats found.</p>
          <p className="mb-6 text-sm text-gray-600">Create a new chat to get started — choose a scenario, language, and level.</p>
          <Link href="/exp/CanaryChat/chats/new">
            <Button>Create New Chat</Button>
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {chats.map((chat: Chat) => (
            <li key={chat.id} className="p-4 border rounded-md hover:shadow-sm flex items-center justify-between">
              <div>
                <Link href={`/exp/CanaryChat/chats/${chat.id}`} className="text-lg font-medium">
                  {chat.title ?? chat.scenario}
                </Link>
                <div className="text-sm text-gray-500">{chat.language} • {chat.level}</div>
              </div>
              <div>
                <Link href={`/exp/CanaryChat/chats/${chat.id}`}>
                  <Button>Open</Button>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
