"use client";
import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Textarea } from "@heroui/input";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/modal";
import { Popover, PopoverContent, PopoverTrigger } from "@heroui/popover";
import { Spinner } from "@heroui/spinner";
import { Chat, ChatMessage, TranslationPiece } from "@prismaClient";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

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

  useEffect(() => {
    getMessages();
    getChat();
  }, [params]);

  return (
    <main className="p-5 flex flex-1 flex-col h-screen overflow-hidden">
      {/* Chat Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <Button isIconOnly variant="light" radius="full" onPress={() => router.push('/exp/CanaryChat/chats')}>
              <span className="material-symbols-outlined">arrow_back</span>
            </Button>
            <h1 className="text-3xl font-bold">{chat?.title}</h1>
          </div>
          <span className="text-sm text-foreground/50 block">{chat?.scenario}</span>
        </div>

        <span className="text-sm text-foreground/50 block text-right">
          Target Language: <br /> {chat?.language || "N/A"}
        </span>
      </div>

      {/* Chat Messages */}
      <div className="gap-4 my-6 flex flex-col-reverse overflow-y-auto grow h-full px-2">
        {loading.generating && (
          <Spinner label="Generating response..." />
        )}

        {messages?.map((message) => (
          <MessageCard
            key={message.id}
            message={message}
            updateMessage={(updatedMessage) => {
              setMessages((prev) => {
                if (!prev) return prev;
                return prev.map((m) => m.id === updatedMessage.id ? updatedMessage : m);
              });
            }}
          />
        ))}
      </div>

      {/* User Input */}
      <form onSubmit={postUserMessage}>
        <Textarea
          value={inputText}
          onValueChange={(val) => setInputText(val)}
          placeholder="Type your message..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              postUserMessage();
            }
          }}
          minRows={1}
          size="lg"
          classNames={{
            innerWrapper: "flex flex-row items-center pl-2 gap-2",
          }}
          endContent={
            <div className="flex items-center gap-2 self-end">
              <TranslationHelperModal chatLanguage={chat?.language || "English"} />
              <Button
                type="submit"
                isIconOnly
                variant="faded"
                isLoading={loading.sending || loading.generating}
                isDisabled={!inputText.trim()}
              >
                <span className="material-symbols-outlined">send</span>
              </Button>
            </div>
          }
        />
      </form>
    </main>
  );
}

/**
 * A component to display a single chat message, with options to translate or listen to the message.
 * If the message has a translation, it can be toggled to show the original text or the translation.
 * The translation is shown in a popover when clicking on the text, and can include nested translation pieces for more detailed translations.
 * 
 * @param message The chat message to display
 * @param updateMessage A function to update the message with new data, such as adding a translation after fetching it from the API
 */
function MessageCard({ message, updateMessage }: { message: ChatMessage, updateMessage: (updatedMessage: ChatMessage) => void }) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [loading, setLoading] = useState({
    translating: false,
  });

  const stylesByRole = {
    USER: "bg-primary/30 self-end",
    MODEL: "bg-content1 self-start",
  };

  const getTranslation = async () => {
    if (message.translation) {
      setShowTranslation(true);
      return message.translation;
    }

    setLoading((prev) => ({
      ...prev,
      translating: true,
    }));

    // Call translation API and update message with translation
    const resBody = await fetch(`/api/exp/CanaryChat/messages/${message.id}/translation`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetLanguage: 'English' })
    })
      .then(res => res.json())
      .catch((err) => {
        console.error('Error fetching translation', err);
        setLoading((prev) => ({
          ...prev,
          translating: false,
        }));
      });

    if (resBody.code !== "OK") {
      console.error('Failed to fetch translation', resBody);
      setLoading((prev) => ({
        ...prev,
        translating: false,
      }));
      return;
    }

    // Update the message with the new translation
    updateMessage({ ...message, translation: resBody.data.translation });
    setLoading((prev) => ({
      ...prev,
      translating: false,
    }));
    setShowTranslation(true);
  };

  const toggleTranslation = () => {
    if (message.translation) {
      setShowTranslation((prev) => !prev);
    } else {
      getTranslation();
    }
  };

  return (
    <Card className={`max-w-[min(66vw,var(--container-2xl))] p-1 shrink-0 ${stylesByRole[message.role]}`}>
      <CardBody>
        {message.translation && showTranslation
          ? (
            <div className="">
              {message.translation.map((piece, index) => {
                return (
                  <TranslationPieceElement key={index} piece={piece} />
                );
              })}
            </div>
          ) : (
            <span className="whitespace-pre-wrap">{message.text}</span>
          )}
      </CardBody>
      <CardFooter className="justify-end gap-2 pt-0">
        <Button
          variant={showTranslation ? "light" : "faded"}
          className={showTranslation ? "opacity-50" : ""}
          size="sm"
          isIconOnly
          isLoading={loading.translating}
          onPress={() => toggleTranslation()}
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
  );
}

/**
 * A component to display a translation piece, which can be a full sentence, a phrase, or a single word.
 * The translation is shown in a popover when clicking on the text.
 * Line breaks are preserved and can be optionally rendered as actual breaks in the UI.
 * 
 * @param piece The translation piece to display
 * @param displayLineBreaks Whether to render line breaks as actual breaks in the UI, or just include them in the text. Default is true.
*/
function TranslationPieceElement({ piece, displayLineBreaks = true }: { piece: TranslationPiece, displayLineBreaks?: boolean }) {
  return (
    <>
      {piece.text.split('\n').map((line, index) => (
        line
          ? <Popover showArrow key={index}>
            <PopoverTrigger>
              <span className="inline-flex items-center px-1 my-0.5 rounded-md mx-px cursor-pointer bg-background/20  hover:bg-background/30 transition-background">
                {line}
              </span>
            </PopoverTrigger>
            <PopoverContent className="px-4 py-2 bg-linear-to-br from-secondary/30 to-primary/10">
              {(piece.translationPieces && piece.translationPieces.length >= 2) && (
                <div className="mb-2 border-b border-foreground/20 pb-2">
                  {piece.translationPieces.map((subPiece, subIndex) => (
                    <TranslationPieceElement key={subIndex} piece={subPiece} displayLineBreaks={false} />
                  ))}
                </div>
              )}

              <span className="font-bold">{piece.translation}</span>
            </PopoverContent>
          </Popover >
          :
          (displayLineBreaks && <br key={index} />)
      ))}
    </>
  );
}

/**
 * A button that opens a modal, which will show a translation interface, and will display the translated message and its pieces.
 * 
 * @param chatLanguage The target language of the chat, which will be the default translation language in the modal.
 */
function TranslationHelperModal({ chatLanguage }: { chatLanguage: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [userText, setUserText] = useState("");
  const [translationResult, setTranslationResult] = useState<{ translation: string; pieces: TranslationPiece[] }>();
  const [loading, setLoading] = useState(false);

  const translateText = async () => {
    setLoading(true);
    const resBody = await fetch(`/api/exp/CanaryChat/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: userText, targetLanguage: chatLanguage, originalLanguage: "English" })
    }).then(res => res.json()).catch((err) =>
      console.error('Error translating text', err)
    );

    if (resBody.code !== "OK") {
      console.error('Failed to translate text', resBody);
      setLoading(false);
      return;
    }

    setTranslationResult(resBody.data);
    setLoading(false);
  };

  return (
    <>
      <Button onPress={() => setIsOpen(true)} isIconOnly variant="faded">
        <span className="material-symbols-outlined">translate</span>
      </Button>
      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <ModalContent className="max-w-lg">
          <ModalHeader>
            <h2 className="text-xl font-bold mb-4">Translation Helper</h2>
          </ModalHeader>
          <ModalBody>
            <Textarea
              value={userText}
              onValueChange={setUserText}
              placeholder="Enter text to translate"
              minRows={3}
            />
            <Button onPress={translateText} className="mt-2" isLoading={loading}>
              Translate
            </Button>

            {translationResult && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold">Translation:</h3>
                <div>
                  {translationResult.pieces.map((piece, index) => {

                    return (
                      <TranslationPieceElement key={index} piece={piece} />
                    )
                  })}
                </div>
              </div>
            )}
          </ModalBody>
          <ModalBody></ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}