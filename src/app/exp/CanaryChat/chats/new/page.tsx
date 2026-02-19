"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { FLUENCY_LEVELS, LANGUAGES } from "@/types/languages";
import { createChatPageTranslation, CreateChatPageTranslation } from "@/locales/Canary/createChat";
import { Language } from "@/contexts/language";
import { useTranslation } from "@/configs/lang";

const SCENARIOS = [
  "I'm in a restaurant, talking to my date about our hobbies",
  "I'm at the airport, talking to the customs officer about my trip",
  "I'm at the doctor's office, discussing my symptoms with the doctor",
  "I'm at a job interview, answering questions about my experience",
  "I'm at a party, introducing myself to someone sitting next to me",
];

export default function NewChatPage() {
  const [form, setForm] = useState({
    title: "",
    scenario: SCENARIOS[0],
    customScenario: "",
    language: LANGUAGES[2].id,
    level: FLUENCY_LEVELS[1],
  });
  const [loading, setLoading] = useState(false);
  const t = useTranslation<CreateChatPageTranslation>(createChatPageTranslation);
  const router = useRouter();

  async function handleChatCreation(e: React.SubmitEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    const resBody = await fetch("/api/exp/CanaryChat/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        scenario: form.scenario === "New scenario"
          ? form.customScenario
          : form.scenario
      }),
    }).then((res) => res.json())
      .catch((err) => {
        console.error("Failed to create chat", err);
        return null;
      });

    if (!resBody || resBody.code !== "OK") {
      console.error("Failed to create chat", resBody);
      setLoading(false);
      return;
    }

    if (resBody.data?.id) router.push(`/exp/CanaryChat/chats/${resBody.data.id}`);
    setLoading(false);
  }

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-linear-to-br from-primary/10 to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-3">
          <h1 className="text-2xl font-bold">{t.cardTitle}</h1>
        </CardHeader>
        <CardBody className="gap-4">
          <form onSubmit={handleChatCreation} className="flex flex-col gap-4">
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Enter chat title"
            />
            <Select
              label="Scenario"
              selectedKeys={[form.scenario]}
              onChange={(e) => handleChange("scenario", e.target.value)}
            >
              {["New scenario", ...SCENARIOS].map((scenarioItem) => (
                <SelectItem key={scenarioItem} textValue={scenarioItem}>
                  <span className={`w-full text-wrap ${scenarioItem === "New scenario" ? "font-semibold text-medium items-center flex gap-1" : ""}`}>
                    {scenarioItem === "New scenario"
                      ? <><span className="material-symbols-outlined">add</span> New scenario!</>
                      : scenarioItem
                    }
                  </span>
                </SelectItem>
              ))}
            </Select>
            {form.scenario === "New scenario" && (
              <Textarea
                label="Custom Scenario"
                value={form.customScenario}
                onValueChange={(value) => handleChange("customScenario", value)}
                placeholder="Describe your scenario in detail. For example: I'm at <place>, talking to <person>, about <topic> while <situation>"
              />
            )}
            <Select
              label="Language"
              selectedKeys={[form.language]}
              onChange={(e) => handleChange("language", e.target.value)}
              renderValue={(items) => {
                const selectedLanguage = LANGUAGES.find(lang => lang.id === items[0].textValue as Language);
                if (!selectedLanguage) return null;

                return (
                  <span className="flex items-center gap-2">
                    <span>{selectedLanguage.icon}</span>
                    {selectedLanguage.name}
                  </span>
                )
              }}
            >
              {LANGUAGES.map((languageItem) => (
                <SelectItem key={languageItem.id} startContent={languageItem.icon} textValue={languageItem.id}>
                  {languageItem.name}
                </SelectItem>
              ))}
            </Select>
            <Select
              label="Level"
              selectedKeys={[form.level]}
              onChange={(e) => handleChange("level", e.target.value)}
            >
              {FLUENCY_LEVELS.map((fluencyLevel) => (
                <SelectItem key={fluencyLevel}>
                  {fluencyLevel}
                </SelectItem>
              ))}
            </Select>
            <Button type="submit" color="primary" className="mt-4" isLoading={loading}>
              Create
            </Button>
          </form>
        </CardBody>
      </Card>
    </main >
  );
}
