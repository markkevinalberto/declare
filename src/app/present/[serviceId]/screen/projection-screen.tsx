"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeProjectionSettings } from "@/lib/projection";
import { FullscreenPrompt } from "../live-widgets";
import { SlideVisual, type SlideVisualState } from "../slide-visual";

export function ProjectionScreen({ serviceId }: { serviceId: string }) {
  const [state, setState] = useState<SlideVisualState | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const mediaElRef = useRef<HTMLVideoElement | null>(null);
  const mediaCleanupRef = useRef<(() => void) | null>(null);
  // The presenter's last-known desired volume, applied the instant a media
  // video mounts — so a video that starts playing right as this window
  // (re)connects picks up the preset immediately, instead of the DOM
  // default (full volume) until the presenter happens to resend it.
  const desiredVolumeRef = useRef(1);

  // Receives the live media-slide video element from SlideVisual, mirrors
  // its playback status to the presenter (which renders the player controls),
  // and is the target for the presenter's media-control commands below.
  const handleMediaVideo = useCallback((el: HTMLVideoElement | null) => {
    mediaCleanupRef.current?.();
    mediaCleanupRef.current = null;
    mediaElRef.current = el;
    if (!el) {
      channelRef.current?.postMessage({ type: "media-status", gone: true });
      return;
    }
    el.volume = desiredVolumeRef.current;
    el.muted = desiredVolumeRef.current === 0;
    const post = () => {
      channelRef.current?.postMessage({
        type: "media-status",
        paused: el.paused,
        currentTime: el.currentTime,
        duration: Number.isFinite(el.duration) ? el.duration : 0,
        volume: el.muted ? 0 : el.volume,
      });
    };
    const events = [
      "play",
      "pause",
      "timeupdate",
      "volumechange",
      "loadedmetadata",
      "durationchange",
      "ended",
    ] as const;
    for (const event of events) el.addEventListener(event, post);
    post();
    mediaCleanupRef.current = () => {
      for (const event of events) el.removeEventListener(event, post);
    };
  }, []);

  useEffect(() => {
    const channel = new BroadcastChannel(`projection:${serviceId}`);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      const msg = event.data;
      if (msg?.type === "state") {
        if (typeof msg.volume === "number" && Number.isFinite(msg.volume)) {
          desiredVolumeRef.current = Math.max(0, Math.min(1, msg.volume));
        }
        setState({
          blank: Boolean(msg.blank),
          clearText: Boolean(msg.clearText),
          reference: typeof msg.reference === "string" ? msg.reference : null,
          lines: Array.isArray(msg.lines) ? msg.lines.map(String) : [],
          richHtml: typeof msg.richHtml === "string" ? msg.richHtml : null,
          media:
            msg.media && typeof msg.media.url === "string"
              ? {
                  kind: msg.media.kind === "video" ? "video" : "image",
                  url: msg.media.url,
                }
              : null,
          countdown:
            msg.countdown?.onProjector &&
            typeof msg.countdown.endsAt === "number"
              ? {
                  endsAt: msg.countdown.endsAt,
                  label: typeof msg.countdown.label === "string" ? msg.countdown.label : "",
                }
              : null,
          crawl:
            msg.crawl &&
            typeof msg.crawl.text === "string" &&
            msg.crawl.target !== "stage"
              ? { text: msg.crawl.text }
              : null,
          settings: normalizeProjectionSettings(msg.settings),
        });
      } else if (msg?.type === "media-control") {
        const el = mediaElRef.current;
        if (!el) return;
        if (msg.action === "play") {
          el.play().catch((err: unknown) => {
            // Muted fallback only for blocked unmuted autoplay — other
            // rejections must not silently mute the video.
            if ((err as DOMException)?.name === "NotAllowedError") {
              el.muted = true;
              el.play().catch(() => {});
            }
          });
        } else if (msg.action === "pause") {
          el.pause();
        } else if (msg.action === "stop") {
          el.pause();
          el.currentTime = 0;
        } else if (msg.action === "seek" && typeof msg.value === "number") {
          el.currentTime = Math.max(0, msg.value);
        } else if (msg.action === "volume" && typeof msg.value === "number") {
          const volume = Math.max(0, Math.min(1, msg.value));
          el.volume = volume;
          el.muted = volume === 0;
        }
      } else if (msg?.type === "ping") {
        // role lets the presenter's "Projector connected" badge ignore
        // pongs coming from stage displays.
        channel.postMessage({ type: "pong", role: "projector" });
      }
    };

    // Ask the presenter console for the current slide on load/reload.
    channel.postMessage({ type: "hello", role: "projector" });

    return () => {
      channel.close();
      channelRef.current = null;
    };
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
    <div className="fixed inset-0 cursor-none select-none">
      <SlideVisual
        state={state}
        muted={false}
        onMediaVideo={handleMediaVideo}
        emptyMessage="Waiting for the presenter…"
      />
      <FullscreenPrompt />
    </div>
  );
}
