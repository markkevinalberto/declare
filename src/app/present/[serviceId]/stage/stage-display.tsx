"use client";

import { useEffect, useState } from "react";
import { richHtmlToLines } from "@/lib/rich-text";
import { CountdownText, CrawlBar, FullscreenPrompt, useNow } from "../live-widgets";

type StageState = {
  slideLabel: string | null;
  lines: string[];
  next: { label: string | null; lines: string[] } | null;
  countdown: { endsAt: number; label: string } | null;
  crawl: { text: string } | null;
};

function Clock() {
  const now = useNow();
  const time = now
    ? new Date(now).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--:--:--";
  return <span className="tabular-nums">{time}</span>;
}

/**
 * The band/vocalist screen (3rd monitor): current lyrics big and bright,
 * what's coming next, a clock, the countdown, and any crawl message aimed
 * at the stage. Deliberately ignores Blank/Clear — the congregation screen
 * going dark shouldn't blind the band too.
 */
export function StageDisplay({
  serviceId,
  serviceTitle,
}: {
  serviceId: string;
  serviceTitle: string;
}) {
  const [state, setState] = useState<StageState | null>(null);

  useEffect(() => {
    const channel = new BroadcastChannel(`projection:${serviceId}`);

    channel.onmessage = (event) => {
      const msg = event.data;
      if (msg?.type === "state") {
        setState({
          slideLabel:
            typeof msg.slideLabel === "string" ? msg.slideLabel : null,
          // A content slide's rich body (bullets/alignment) has no plain
          // `lines` — this screen has no notion of that formatting anyway,
          // so it falls back to a plain-text approximation, one line per
          // paragraph/list item.
          lines:
            typeof msg.richHtml === "string"
              ? richHtmlToLines(msg.richHtml)
              : Array.isArray(msg.lines)
                ? msg.lines.map(String)
                : [],
          next:
            msg.next && Array.isArray(msg.next.lines)
              ? {
                  label:
                    typeof msg.next.label === "string" ? msg.next.label : null,
                  lines: msg.next.lines.map(String),
                }
              : null,
          countdown:
            msg.countdown && typeof msg.countdown.endsAt === "number"
              ? {
                  endsAt: msg.countdown.endsAt,
                  label:
                    typeof msg.countdown.label === "string"
                      ? msg.countdown.label
                      : "",
                }
              : null,
          crawl:
            msg.crawl &&
            typeof msg.crawl.text === "string" &&
            msg.crawl.target !== "projector"
              ? { text: msg.crawl.text }
              : null,
        });
      } else if (msg?.type === "ping") {
        channel.postMessage({ type: "pong", role: "stage" });
      }
    };

    channel.postMessage({ type: "hello", role: "stage" });
    return () => channel.close();
  }, [serviceId]);

  useEffect(() => {
    function onDoubleClick() {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    }
    document.addEventListener("dblclick", onDoubleClick);
    return () => document.removeEventListener("dblclick", onDoubleClick);
  }, []);

  return (
    <div
      className="fixed inset-0 flex cursor-none select-none flex-col bg-black text-white"
      style={{ containerType: "size" }}
    >
      <header className="flex shrink-0 items-baseline justify-between gap-[2cqw] border-b border-white/15 px-[2.5cqw] py-[1.5cqh]">
        <span
          className="font-bold text-white"
          style={{ fontSize: "min(5cqw, 7cqh)" }}
        >
          <Clock />
        </span>
        <span
          className="min-w-0 truncate text-white/50"
          style={{ fontSize: "min(2.4cqw, 3.6cqh)" }}
        >
          {serviceTitle}
        </span>
        {state?.countdown ? (
          <span
            className="shrink-0 font-bold"
            style={{ fontSize: "min(5cqw, 7cqh)" }}
          >
            {state.countdown.label ? (
              <span
                className="mr-[1cqw] font-normal text-white/60"
                style={{ fontSize: "min(2.4cqw, 3.6cqh)" }}
              >
                {state.countdown.label}
              </span>
            ) : null}
            <CountdownText
              endsAt={state.countdown.endsAt}
              className="text-emerald-400"
              warnClassName="text-red-500"
            />
          </span>
        ) : null}
      </header>

      <main className="flex min-h-0 flex-1 flex-col justify-center gap-[3cqh] px-[3cqw] py-[2cqh]">
        {state === null ? (
          <p
            className="text-center text-white/40"
            style={{ fontSize: "min(3cqw, 4.5cqh)" }}
          >
            Waiting for the presenter…
          </p>
        ) : (
          <>
            <div className="min-h-0">
              {state.slideLabel ? (
                <p
                  className="pb-[1cqh] font-semibold uppercase tracking-widest text-white/50"
                  style={{ fontSize: "min(1.8cqw, 2.8cqh)" }}
                >
                  {state.slideLabel}
                </p>
              ) : null}
              <div
                className="grid gap-[1cqh] font-semibold leading-tight"
                style={{ fontSize: "min(5.5cqw, 8.5cqh)" }}
              >
                {(state.lines.length > 0
                  ? state.lines
                  : state.countdown
                    ? []
                    : ["—"]
                ).map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>

            {state.next ? (
              <div className="min-h-0 border-t border-white/15 pt-[2cqh]">
                <p
                  className="pb-[1cqh] font-semibold uppercase tracking-widest text-amber-400/80"
                  style={{ fontSize: "min(1.8cqw, 2.8cqh)" }}
                >
                  Next{state.next.label ? ` · ${state.next.label}` : ""}
                </p>
                <div
                  className="grid gap-[0.6cqh] leading-tight text-amber-200/70"
                  style={{ fontSize: "min(3.2cqw, 5cqh)" }}
                >
                  {state.next.lines.slice(0, 3).map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </main>

      {state?.crawl ? <CrawlBar text={state.crawl.text} /> : null}
      <FullscreenPrompt />
    </div>
  );
}
