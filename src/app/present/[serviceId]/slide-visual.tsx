"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { DEFAULT_PROJECTION_SETTINGS, type ProjectionSettings } from "@/lib/projection";
import { CountdownText, CrawlBar } from "./live-widgets";

export type SlideVisualState = {
  /** Hides everything — text and background — to plain black. */
  blank: boolean;
  /** Hides just the text/reference, leaving the background showing. */
  clearText: boolean;
  reference: string | null;
  lines: string[];
  /** A content slide's rich body (bullets, numbering, alignment) as HTML —
   * takes over from `lines` when present. */
  richHtml: string | null;
  /** A media slide's image or video — shown as the main content, uncropped. */
  media: { kind: "image" | "video"; url: string } | null;
  /**
   * Pre-service countdown shown INSTEAD of the slide text (the background
   * keeps playing). Ticks locally from the fixed end time.
   */
  countdown: { endsAt: number; label: string } | null;
  /** Scrolling announcement ticker along the bottom edge. */
  crawl: { text: string } | null;
  settings: ProjectionSettings;
};

const TEXT_SHADOW = "0 2px 24px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,0.85)";

/** Crossfade duration for background/text/Clear/Blank changes. */
const FADE_MS = 500;

type BgValue = { type: "none" | "image" | "video"; url: string };
type TextValue = {
  lines: string[];
  richHtml: string | null;
  reference: string | null;
  settings: ProjectionSettings;
};
type MediaValue = { kind: "image" | "video"; url: string } | null;
type CountdownValue = { endsAt: number; label: string; settings: ProjectionSettings } | null;

type FadeEntry<T> = {
  id: number;
  key: string;
  /**
   * The value this layer renders. Live (refreshed each render) while the
   * layer's key matches the current key; frozen from the moment the key
   * moves on.
   */
  value: T;
  role: "in" | "out";
  /** Opacity the layer should sit at ("out" layers in a dissolve hold 1). */
  target: number;
};

/**
 * Maintains a stack of crossfading layers keyed by content identity: when
 * `key` changes, the live layer flips to a fading-"out" role IN PLACE — same
 * entry id, so React keeps its DOM alive (a playing background video must
 * not remount mid-fade; recreating the node showed a black blink while it
 * reloaded) — and a new "in" layer is appended, entering at opacity 0.
 *
 * With `dissolve`, "out" layers hold full opacity while the new content
 * fades in over them (backgrounds — avoids the mid-fade dip to black), only
 * fading out themselves when the new key is "none" (nothing will cover
 * them). Without it, "out" layers always fade to 0 (text — the new lines
 * don't cover the old ones).
 *
 * Runs in a layout effect so the flip commits in the same paint as the key
 * change — after-paint effects showed a one-frame gap with the old content
 * missing.
 */
function useFadeLayers<T>(
  current: T,
  key: string,
  duration: number,
  dissolve: boolean
) {
  const idRef = useRef(1);
  const inIdRef = useRef(0);
  const keyRef = useRef(key);
  const valueRef = useRef(current);
  const timeoutsRef = useRef(new Set<ReturnType<typeof setTimeout>>());
  const [layers, setLayers] = useState<FadeEntry<T>[]>(() => [
    { id: 0, key, value: current, role: "in", target: 1 },
  ]);

  useLayoutEffect(() => {
    if (keyRef.current !== key) {
      const frozenValue = valueRef.current;
      const flippedId = inIdRef.current;
      const inId = idRef.current++;
      inIdRef.current = inId;
      const outTarget = dissolve && key !== "none" ? 1 : 0;
      setLayers((prev) => [
        ...prev.map((layer) =>
          layer.id === flippedId
            ? { ...layer, role: "out" as const, value: frozenValue, target: outTarget }
            : layer
        ),
        { id: inId, key, value: current, role: "in" as const, target: 1 },
      ]);
      // Each removal timer runs independently — cancelling it when the key
      // changes again mid-fade would strand the older layer on screen.
      const timeout = setTimeout(() => {
        timeoutsRef.current.delete(timeout);
        setLayers((prev) => prev.filter((layer) => layer.id !== flippedId));
      }, duration + 150);
      timeoutsRef.current.add(timeout);
      keyRef.current = key;
    }
    valueRef.current = current;
  }, [key, current, duration, dissolve]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      for (const timeout of timeouts) clearTimeout(timeout);
    };
  }, []);

  // A layer renders the LIVE value only while its key still matches the
  // current key (so style-only tweaks flow through without a fade). The
  // moment the key moves on it renders its stored value instead — critically,
  // this also covers the one pre-paint commit BEFORE the layout effect flips
  // it to "out": rendering the live value there would swap the old layer's
  // content to the new value for a commit and back, remounting its
  // img/video DOM node — a restarted video shows black for a beat (the
  // "blink" seen on Blank).
  return layers.map((layer) =>
    layer.key === key ? { ...layer, value: current } : layer
  );
}

/**
 * A stacked, absolutely-positioned layer that eases its opacity toward
 * `target`. Enters at 0 (new content always fades in); when `target` later
 * changes (the layer flips to fading out), it animates from wherever it
 * currently is.
 */
function FadeLayer({
  duration,
  target,
  children,
}: {
  duration: number;
  target: number;
  children: React.ReactNode;
}) {
  const [opacity, setOpacity] = useState(0);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    // Two frames: first (re)attach the transition — it's dropped once a fade
    // settles, see below — then move the opacity, so the change animates
    // from the currently painted value instead of jumping.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      setSettled(false);
      raf2 = requestAnimationFrame(() => setOpacity(target));
    });
    const timer = setTimeout(() => setSettled(true), duration + 120);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(timer);
    };
  }, [target, duration]);

  return (
    <div
      className={
        // Drop the transition entirely once the fade completes — a
        // permanently attached opacity transition kept these layers promoted
        // in the compositor, which was seen rendering finished layers black.
        settled
          ? "absolute inset-0"
          : "absolute inset-0 transition-opacity ease-in-out"
      }
      style={{
        opacity,
        transitionDuration: settled ? undefined : `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
}

/** A media slide's natural pixel dimensions, for sizing its display box. */
export type MediaSize = { width: number; height: number };

/**
 * A media slide's video. Plays with sound where the browser allows it
 * (the projector window); if unmuted autoplay is blocked, falls back to
 * playing muted rather than sitting frozen on the first frame.
 *
 * `onElement` hands the live element to the host page so it can be driven
 * by the presenter's player controls (play/pause/seek/volume) and report
 * playback status back.
 */
function MediaVideo({
  url,
  muted,
  onElement,
  onSize,
}: {
  url: string;
  muted: boolean;
  onElement?: (el: HTMLVideoElement | null) => void;
  onSize?: (size: MediaSize) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    onElement?.(el);
    return () => onElement?.(null);
  }, [onElement]);

  // Autoplay only when the video itself changes — NOT when onElement does
  // (it flips to undefined as the layer starts fading out, and that must
  // not resume a video the operator paused).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.play().catch((err: unknown) => {
      // Fall back to muted ONLY when the browser blocked unmuted autoplay.
      // Other rejections (e.g. a transient AbortError) must not silently
      // mute a video the operator expects sound from.
      if ((err as DOMException)?.name === "NotAllowedError") {
        el.muted = true;
        el.play().catch(() => {});
      }
    });
  }, [url]);

  return (
    <video
      ref={ref}
      src={url}
      autoPlay
      playsInline
      muted={muted}
      disablePictureInPicture
      disableRemotePlayback
      onLoadedMetadata={(e) =>
        onSize?.({
          width: e.currentTarget.videoWidth,
          height: e.currentTarget.videoHeight,
        })
      }
      className="absolute inset-0 size-full object-contain"
    />
  );
}

function renderMedia(
  value: MediaValue,
  muted: boolean,
  onElement?: (el: HTMLVideoElement | null) => void,
  onSize?: (size: MediaSize) => void
) {
  if (!value) return null;
  return (
    <>
      {/* Each media layer brings its own black backdrop so letterbox bars
          stay black during a dissolve between photos of different shapes
          (and the theme background doesn't bleed through the bars). */}
      <div className="absolute inset-0 bg-black" />
      {value.kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value.url}
          alt=""
          onLoad={(e) =>
            onSize?.({
              width: e.currentTarget.naturalWidth,
              height: e.currentTarget.naturalHeight,
            })
          }
          className="absolute inset-0 size-full object-contain"
        />
      ) : (
        <MediaVideo url={value.url} muted={muted} onElement={onElement} onSize={onSize} />
      )}
    </>
  );
}

function renderBackground(value: BgValue) {
  if (value.type === "image") {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value.url} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-black/30" />
      </>
    );
  }
  if (value.type === "video") {
    return (
      <>
        <video
          src={value.url}
          autoPlay
          loop
          muted
          playsInline
          disablePictureInPicture
          disableRemotePlayback
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
      </>
    );
  }
  return null;
}

function TextBlock({
  lines,
  richHtml,
  reference,
  settings,
}: {
  lines: string[];
  richHtml: string | null;
  reference: string | null;
  settings: ProjectionSettings;
}) {
  const [scale, setScale] = useState(1);
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  // Lines wrap unpredictably, so fit by measurement: render at the base
  // font size, then shrink the whole block until it fits the box. Since
  // this is a ratio of the box's own size, it works identically whether
  // the box is a fullscreen window or a small embedded preview.
  useLayoutEffect(() => {
    function fit() {
      const box = boxRef.current;
      const text = textRef.current;
      if (!box || !text) return;
      setScale(
        Math.min(
          1,
          box.clientWidth / Math.max(text.scrollWidth, 1),
          box.clientHeight / Math.max(text.scrollHeight, 1)
        )
      );
    }
    fit();
    const observer = new ResizeObserver(fit);
    if (boxRef.current) observer.observe(boxRef.current);
    if (textRef.current) observer.observe(textRef.current);
    return () => observer.disconnect();
  }, [lines, richHtml, settings.fontScale]);

  if (lines.length === 0 && !richHtml) return null;

  const textStyle = {
    fontFamily: settings.fontFamily,
    fontSize: `calc(min(8.5cqw, 11cqh) * ${settings.fontScale})`,
    color: settings.textColor,
    fontWeight: settings.bold ? 800 : 600,
    fontStyle: settings.italic ? "italic" : undefined,
    textTransform: settings.allCaps ? "uppercase" : undefined,
    textShadow: settings.shadow ? TEXT_SHADOW : undefined,
    WebkitTextStroke: settings.stroke
      ? `${settings.strokeWidth}em ${settings.strokeColor}`
      : undefined,
    transform: `scale(${scale})`,
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        ref={boxRef}
        className="relative flex h-[88%] w-[92%] items-center justify-center"
      >
        {richHtml ? (
          // Alignment (left/center/right) and lists come from the editor's
          // own HTML — the container just defaults unstyled paragraphs to
          // centered, matching the plain-lines slides' look.
          <div
            ref={textRef}
            className="projected-rich-text w-full text-center leading-tight"
            style={textStyle}
            dangerouslySetInnerHTML={{ __html: richHtml }}
          />
        ) : (
          <div
            ref={textRef}
            className="grid w-full gap-[0.45em] text-center leading-tight text-balance"
            style={textStyle}
          >
            {lines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
      </div>
      {reference ? (
        <p
          className="absolute bottom-[4%] left-[4%] font-bold"
          style={{
            fontFamily: settings.fontFamily,
            fontSize: "min(3cqw, 4.5cqh)",
            color: settings.textColor,
            textShadow: settings.shadow ? TEXT_SHADOW : undefined,
            WebkitTextStroke: settings.stroke
              ? `${settings.strokeWidth}em ${settings.strokeColor}`
              : undefined,
          }}
        >
          {reference}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Renders exactly what the projector shows — background, text style,
 * reference caption — scaled to fill whatever box the caller sizes it to.
 * Used by both the fullscreen projector window and the presenter's small
 * live-monitor preview, so the two never visually drift apart.
 *
 * Background and text each crossfade whenever their content changes —
 * including the Blank and Clear toggles — instead of cutting instantly.
 */
export function SlideVisual({
  state,
  emptyMessage,
  className,
  muted = true,
  onMediaVideo,
  onMediaSize,
}: {
  state: SlideVisualState | null;
  emptyMessage?: string;
  className?: string;
  /** Media-slide videos play silently unless the caller (the projector) opts in. */
  muted?: boolean;
  /**
   * Receives the CURRENT media slide's video element (null when it goes
   * away). Layers still fading out never report — only the live one.
   * Pass a stable (useCallback) function.
   */
  onMediaVideo?: (el: HTMLVideoElement | null) => void;
  /**
   * Receives the CURRENT media slide's natural pixel size once it loads
   * (null when there's no media on this slide), so the host can size its
   * display box to match instead of a fixed frame. Pass a stable function.
   */
  onMediaSize?: (size: MediaSize | null) => void;
}) {
  const settings = state?.settings ?? DEFAULT_PROJECTION_SETTINGS;

  const bgVisible = Boolean(
    state && !state.blank && settings.bgType !== "none" && settings.bgUrl
  );
  const bgValue: BgValue = bgVisible
    ? { type: settings.bgType, url: settings.bgUrl }
    : { type: "none", url: "" };
  const bgKey = bgVisible ? `${bgValue.type}:${bgValue.url}` : "none";
  const bgLayers = useFadeLayers(bgValue, bgKey, FADE_MS, true);

  // Media stays MOUNTED across Blank/Clear — its fade-layer identity is
  // keyed purely on the slide's own content, never on blank/clearText.
  // Blank/Clear instead toggle a plain opacity wrapper around it below, so a
  // playing/paused video keeps its position and pause state intact instead
  // of being torn down and remounted (which restarted it at 0:00).
  const mediaValue: MediaValue = state?.media ?? null;
  const mediaKey = mediaValue ? `${mediaValue.kind}:${mediaValue.url}` : "none";
  const mediaLayers = useFadeLayers(mediaValue, mediaKey, FADE_MS, true);
  // Media counts as content (like text), so Clear hides it too — Blank
  // already hides everything.
  const mediaHidden = Boolean(state && (state.blank || state.clearText));

  useEffect(() => {
    if (mediaKey === "none") onMediaSize?.(null);
    // Only reset on "no media" (keyed on the stable mediaKey string, not the
    // mediaValue object literal, so this doesn't fire every render) — a
    // loaded size is refreshed by onLoad/onLoadedMetadata firing below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaKey]);

  // The countdown replaces the slide text (deliberate overlay, so Clear
  // doesn't hide it — only Blank does). Keyed by its end time so the
  // per-second ticking never re-triggers a fade.
  const countdownValue: CountdownValue =
    state && !state.blank && state.countdown
      ? { ...state.countdown, settings }
      : null;
  const countdownKey = countdownValue
    ? `cd:${countdownValue.endsAt}:${countdownValue.label}`
    : "none";
  const countdownLayers = useFadeLayers(countdownValue, countdownKey, FADE_MS, false);

  const textVisible = Boolean(
    state && !state.blank && !state.clearText && !state.countdown
  );
  const rawLines = textVisible ? state?.lines ?? [] : [];
  const rawRichHtml = textVisible ? state?.richHtml ?? null : null;
  const rawReference = textVisible ? state?.reference ?? null : null;
  const textValue: TextValue = {
    lines: rawLines,
    richHtml: rawRichHtml,
    reference: rawReference,
    settings,
  };
  const textKey = rawRichHtml
    ? `rich:${rawRichHtml}`
    : rawLines.length > 0
      ? `${JSON.stringify(rawLines)}::${rawReference ?? ""}`
      : "none";
  const textLayers = useFadeLayers(textValue, textKey, FADE_MS, false);

  const crawl = state && !state.blank ? state.crawl : null;

  return (
    <div
      className={cn(
        "relative flex size-full items-center justify-center overflow-hidden bg-black",
        className
      )}
      style={{ containerType: "size" }}
    >
      {bgLayers.map((layer) => (
        <FadeLayer key={`bg-${layer.id}`} duration={FADE_MS} target={layer.target}>
          {renderBackground(layer.value)}
        </FadeLayer>
      ))}

      <div
        className="absolute inset-0 transition-opacity ease-in-out"
        style={{
          opacity: mediaHidden ? 0 : 1,
          transitionDuration: `${FADE_MS}ms`,
          pointerEvents: mediaHidden ? "none" : undefined,
        }}
      >
        {mediaLayers.map((layer) => (
          <FadeLayer key={`media-${layer.id}`} duration={FADE_MS} target={layer.target}>
            {renderMedia(
              layer.value,
              muted,
              layer.role === "in" ? onMediaVideo : undefined,
              layer.role === "in" ? onMediaSize : undefined
            )}
          </FadeLayer>
        ))}
      </div>

      {textLayers.map((layer) => (
        <FadeLayer key={`text-${layer.id}`} duration={FADE_MS} target={layer.target}>
          <TextBlock
            lines={layer.value.lines}
            richHtml={layer.value.richHtml}
            reference={layer.value.reference}
            settings={layer.value.settings}
          />
        </FadeLayer>
      ))}

      {countdownLayers.map((layer) => (
        <FadeLayer key={`cd-${layer.id}`} duration={FADE_MS} target={layer.target}>
          {layer.value ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-[2cqh]">
              {layer.value.label ? (
                <p
                  className="px-[4cqw] text-center"
                  style={{
                    fontFamily: layer.value.settings.fontFamily,
                    fontSize: "min(5cqw, 7cqh)",
                    color: layer.value.settings.textColor,
                    fontWeight: 600,
                    textShadow: layer.value.settings.shadow ? TEXT_SHADOW : undefined,
                  }}
                >
                  {layer.value.label}
                </p>
              ) : null}
              <p
                style={{
                  fontFamily: layer.value.settings.fontFamily,
                  fontSize: "min(18cqw, 30cqh)",
                  color: layer.value.settings.textColor,
                  fontWeight: 800,
                  lineHeight: 1,
                  textShadow: layer.value.settings.shadow ? TEXT_SHADOW : undefined,
                }}
              >
                <CountdownText endsAt={layer.value.endsAt} />
              </p>
            </div>
          ) : null}
        </FadeLayer>
      ))}

      {crawl ? <CrawlBar text={crawl.text} /> : null}

      {state === null && emptyMessage ? (
        <p className="px-4 text-center text-[min(3cqw,4cqh)] text-white/40">
          {emptyMessage}
        </p>
      ) : null}
    </div>
  );
}
