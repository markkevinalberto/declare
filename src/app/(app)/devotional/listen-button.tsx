"use client";

import { useEffect, useState } from "react";
import { Pause, Volume2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "idle" | "speaking" | "paused";

/**
 * Reads the devotional aloud with the device's own built-in voice (Web
 * Speech API) — no server call, no API key, no audio file to generate or
 * store. Voice quality and availability are whatever the phone/browser
 * ships with. Hidden entirely on browsers that don't support it.
 */
export function ListenButton({ text }: { text: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  if (!supported) return null;

  function handleClick() {
    if (status === "idle") {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.onend = () => setStatus("idle");
      utterance.onerror = () => setStatus("idle");
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      setStatus("speaking");
    } else if (status === "speaking") {
      window.speechSynthesis.pause();
      setStatus("paused");
    } else {
      window.speechSynthesis.resume();
      setStatus("speaking");
    }
  }

  function stop() {
    window.speechSynthesis.cancel();
    setStatus("idle");
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
          status !== "idle"
            ? "border-primary/30 bg-primary/10 text-primary"
            : "border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Volume2
          className={cn("size-4 transition-opacity", status === "speaking" && "hidden")}
        />
        <Pause className={cn("size-4", status !== "speaking" && "hidden")} />
        {status === "speaking" ? "Pause" : status === "paused" ? "Resume" : "Listen to this devotional"}
      </button>
      {status !== "idle" ? (
        <button
          type="button"
          onClick={stop}
          aria-label="Stop reading"
          className="flex size-8 items-center justify-center rounded-full border border-input bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
