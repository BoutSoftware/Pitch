"use client";

import { ButtonProps, Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { useEffect, useState } from "react";

export const CopyButton = ({ value, size, variant, className }: { value: string, size?: ButtonProps["size"], variant?: ButtonProps["variant"], className?: string }) => {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState<boolean>(false);

  async function copyToClipboard(textToCopy: string) {
    // Navigator clipboard api needs a secure context (https)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(textToCopy);
    } else {
      // Use the 'out of viewport hidden text area' trick
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;

      // Move textarea out of the viewport so it's not visible
      textArea.style.position = "absolute";
      textArea.style.left = "-999999px";

      document.body.prepend(textArea);
      textArea.select();

      try {
        document.execCommand('copy');
      } catch (error) {
        console.error(error);
      } finally {
        textArea.remove();
      }
    }
  }

  const handleCopyPassword = () => {
    copyToClipboard(value);

    setCopied(true);
    setOpen(true);

    setTimeout(() => {
      setCopied(false);
    }, 10000);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setOpen(true);

      if (!navigator.clipboard || !window.isSecureContext) return;

      navigator.clipboard.readText().then((clipboardText) => {
        if (clipboardText === value) {
          setCopied(true);
        } else {
          setCopied(false);
        }
      });
    } else {
      setOpen(false);
    }
  };

  useEffect(() => {
    setCopied(false);
  }, [value]);

  return (
    <Tooltip showArrow={true}
      isOpen={open}
      onOpenChange={handleOpenChange}
      content={
        (!copied ?
          <div className="flex">
            Copy
          </div> :
          <div className="flex gap-1">
            <span className="material-symbols-outlined text-success">check</span>
            Copied
          </div>
        )
      }
    >
      <Button isIconOnly variant={variant || "flat"} onPress={handleCopyPassword} size={size || "md"}
        className={className}
      >
        {!copied ?
          <span className="material-symbols-outlined">content_copy</span> :
          <span className="material-symbols-outlined text-success">check</span>
        }
      </Button>
    </Tooltip>
  );
};