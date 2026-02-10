"use client";
import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Textarea } from "@heroui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@heroui/popover";
import { Spinner } from "@heroui/spinner";
import { Chat, ChatMessage } from "@prismaClient";
import React, { useEffect, useState } from "react";

export default function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const [chat, setChat] = useState<Chat>();
  const [messages, setMessages] = useState<ChatMessage[]>();
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState({
    sending: false,
    generating: false,
    translating: {} as Record<string, boolean>, // messageId -> loading state
  });

  async function getChat() {
    const { chatId } = await params;
    const res = await fetch(`/api/exp/CanaryChat/chats/${chatId}`);
    const resBody = await res.json();

    if (!res.ok) {
      console.error('Failed to fetch chat', resBody);
      return;
    }

    setChat(resBody.data);
  }

  async function getMessages() {
    const { chatId } = await params;
    const res = await fetch(`/api/exp/CanaryChat/chats/${chatId}/messages`);
    const resBody = await res.json();

    if (!res.ok) {
      console.error('Failed to fetch messages', resBody);
      return;
    }

    setMessages(resBody.data);
  }

  async function postUserMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!inputText) return;
    if (loading.sending || loading.generating) return;

    const { chatId } = await params;

    setLoading((prev) => ({ ...prev, sending: true }));
    const resBody = await fetch(`/api/exp/CanaryChat/chats/${chatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: inputText })
    }).then(res => res.json()).catch((err) =>
      console.error('Error posting message', err)
    );

    if (resBody.code !== "OK") {
      console.error('Failed to post message', resBody);
      setLoading((prev) => ({ ...prev, sending: false }));
      return;
    }

    setLoading((prev) => ({ ...prev, sending: false }));
    setInputText('');
    setMessages((prev) => {
      return [resBody.data, ...(prev || [])];
    });

    // After posting user message, trigger model response generation
    generateModelResponse();
  }

  async function generateModelResponse() {
    const { chatId } = await params;

    setLoading((prev) => ({ ...prev, generating: true }));
    const res = await fetch(`/api/exp/CanaryChat/chats/${chatId}/generate`, {
      method: 'POST',
    });
    const resBody = await res.json();

    if (!res.ok) {
      console.error('Failed to generate model response', resBody);
      setLoading((prev) => ({ ...prev, generating: false }));
      return;
    }

    setLoading((prev) => ({ ...prev, generating: false }));
    setMessages((prev) => {
      return [resBody.data, ...(prev || [])];
    });
  }

  async function getTranslation(messageId: string) {
    if (!messages) return;

    const selectedMessage = messages.find((m) => m.id === messageId);
    if (!selectedMessage) return alert('Message not found');

    if (selectedMessage?.translation) {
      return selectedMessage.translation;
    }

    setLoading((prev) => ({
      ...prev,
      translating: { ...prev.translating, [messageId]: true },
    }));
    // return await fetch(`/api/exp/CanaryChat/translate`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ text: selectedMessage.text, targetLanguage: "English" })
    // })
    //   .then(res => res.json())
    //   .catch((err) => {
    //     console.error('Error fetching translation', err);
    //     setLoading((prev) => ({
    //       ...prev,
    //       translating: { ...prev.translating, [messageId]: false },
    //     }));
    //   });


    const resBody = await fetch(`/api/exp/CanaryChat/messages/${messageId}/translation`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetLanguage: 'English' })
    })
      .then(res => res.json())
      .catch((err) => {
        console.error('Error fetching translation', err);
        setLoading((prev) => ({
          ...prev,
          translating: { ...prev.translating, [messageId]: false },
        }));
      });

    if (resBody.code !== "OK") {
      console.error('Failed to fetch translation', resBody);
      setLoading((prev) => ({
        ...prev,
        translating: { ...prev.translating, [messageId]: false },
      }));
      return;
    }

    setMessages((prev) => {
      if (!prev) return prev;
      return prev.map((m) => {
        if (m.id === messageId) {
          return resBody.data;
        }
        return m;
      });
    });
    setLoading((prev) => ({
      ...prev,
      translating: { ...prev.translating, [messageId]: false },
    }));
  }


  useEffect(() => {
    getMessages();
    getChat();
  }, [params]);

  return (
    <main className="p-5 flex flex-1 flex-col h-screen overflow-hidden">
      {/* Chat Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{chat?.title}</h1>
          <span className="text-sm text-foreground/50 block">{chat?.scenario}</span>
        </div>

        <span className="text-sm text-foreground/50 block text-right">
          Target Language: <br /> {chat?.language || "N/A"}
        </span>
      </div>

      {/* Chat Messages */}
      <div className="gap-4 my-6 flex flex-col-reverse overflow-y-auto grow h-full px-2">
        {messages?.map((message) => (
          <Card key={message.id} className={`max-w-2/3 p-1 shrink-0 ${message.role === 'USER' ? 'self-end bg-content1' : 'self-start bg-content2'}`}>
            <CardBody>
              {message.translation
                ? (
                  <div className="">
                    {message.translation.map((piece, index) => {
                      return (
                        <Popover key={`${message.id}-${index}`} showArrow>
                          <PopoverTrigger>
                            <span className="inline-flex items-center px-0.5 my-0.5 mx-0.5 rounded cursor-pointer bg-background/20 hover:bg-background/80 transition-background">
                              {piece.text}
                            </span>
                          </PopoverTrigger>
                          <PopoverContent className="px-4 py-2 bg-linear-to-br from-secondary/30 to-secondary/10">
                            <span className="font-bold">{piece.translation}</span>
                          </PopoverContent>
                        </Popover>
                      );
                    })}
                  </div>
                ) : (
                  <span>{message.text}</span>
                )}
            </CardBody>
            <CardFooter className="justify-end gap-2 pt-0">
              <Button
                variant="faded"
                size="sm"
                isIconOnly
                className={message.translation ? "hidden" : ""}
                isLoading={loading.translating[message.id]}
                onPress={() => getTranslation(message.id)}
              >
                <span className="material-symbols-outlined">translate</span>
              </Button>
              <Button
                variant="faded"
                size="sm"
                isIconOnly
                onPress={() => alert('Listen feature not implemented yet')}
              >
                <span className="material-symbols-outlined">volume_up</span>
              </Button>
            </CardFooter>
          </Card>
        ))}

        {loading.generating && (
          <Spinner label="Generating response..." />
        )}
      </div>

      {/* User Input */}
      <form onSubmit={postUserMessage}>
        <Textarea
          value={inputText}
          onValueChange={(val) => setInputText(val)}
          placeholder="Type your message..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              // Get button and trigger click (to contemplate disabled state)
              const button = e.currentTarget.querySelector('button[type="submit"]') as HTMLButtonElement;
              if (button && !button.disabled) {
                button.click();
              }
            }
          }}
          minRows={1}
          size="lg"
          classNames={{
            innerWrapper: "flex flex-row items-center pl-2",
          }}
          endContent={
            <Button
              type="submit"
              isIconOnly
              variant="faded"
              isLoading={loading.sending || loading.generating}
              isDisabled={!inputText.trim()}
            >
              <span className="material-symbols-outlined">send</span>
            </Button>
          }
        />
      </form>
    </main>
  );
}
