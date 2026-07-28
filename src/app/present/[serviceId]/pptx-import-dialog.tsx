"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImageIcon, Loader2, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { plainTextToHtml } from "@/lib/rich-text";
import {
  openPptxZip,
  parsePptx,
  readZipBlob,
  type ParsedSlide,
} from "@/lib/pptx-import";
import {
  addContentPlanItem,
  addMediaPlanItem,
  saveContentText,
  saveMediaConfig,
} from "./actions";
import { savePlanItemFiles } from "./media-store";

const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

/** First non-blank line of a slide's text, or a placeholder for the list. */
function snippetFor(slide: ParsedSlide): string {
  const firstLine = slide.text
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .find(Boolean);
  if (firstLine) return firstLine;
  return slide.images.length > 0 ? "Image" : "Empty slide";
}

function extensionForMimeType(mimeType: string): string {
  const subtype = mimeType.split("/")[1] ?? "png";
  return subtype.split("+")[0] || "png";
}

export function PptxImportDialog({
  serviceId,
  onImported,
}: {
  serviceId: string;
  onImported: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [slides, setSlides] = useState<ParsedSlide[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function resetState() {
    setFile(null);
    setSlides(null);
    setProgress(null);
  }

  async function handleFile(picked: File) {
    const looksLikePptx =
      picked.name.toLowerCase().endsWith(".pptx") || picked.type === PPTX_MIME;
    if (!looksLikePptx) {
      toast.error("Choose a .pptx file.");
      return;
    }

    setParsing(true);
    setSlides(null);
    try {
      const parsed = await parsePptx(picked);
      if (parsed.length === 0) {
        toast.error("That presentation has no slides.");
        return;
      }
      setFile(picked);
      setSlides(parsed);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not read that PowerPoint file."
      );
    } finally {
      setParsing(false);
    }
  }

  async function handleImport() {
    if (!slides || !file) return;

    setImporting(true);
    let zip: Awaited<ReturnType<typeof openPptxZip>> | null = null;
    try {
      zip = await openPptxZip(file);
    } catch {
      toast.error("Could not re-read that PowerPoint file.");
      setImporting(false);
      return;
    }

    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < slides.length; i++) {
      setProgress({ current: i + 1, total: slides.length });
      const slide = slides[i];
      const text = slide.text.trim();

      try {
        if (text) {
          const created = await addContentPlanItem(serviceId);
          if (created?.error || !created.planItemId) {
            skipped += 1;
            continue;
          }
          const html = plainTextToHtml(slide.text);
          const saved = await saveContentText(created.planItemId, html);
          if (saved?.error) {
            skipped += 1;
            continue;
          }
          imported += 1;
        } else if (slide.images.length > 0) {
          const image = slide.images[0];
          const blob = await readZipBlob(zip, image.zipPath, image.mimeType);
          if (!blob) {
            skipped += 1;
            continue;
          }
          const created = await addMediaPlanItem(serviceId);
          if (created?.error || !created.planItemId) {
            skipped += 1;
            continue;
          }
          const filename = `slide-${i + 1}.${extensionForMimeType(image.mimeType)}`;
          const imageFile = new File([blob], filename, { type: image.mimeType });
          await savePlanItemFiles(created.planItemId, [imageFile]);
          const saved = await saveMediaConfig(created.planItemId, {
            files: [{ name: filename, type: "image" }],
          });
          if (saved?.error) {
            skipped += 1;
            continue;
          }
          imported += 1;
        } else {
          skipped += 1;
        }
      } catch {
        skipped += 1;
      }
    }

    setImporting(false);
    setProgress(null);
    toast.success(
      `Imported ${imported} slide${imported === 1 ? "" : "s"} (${skipped} skipped — empty)`
    );
    setOpen(false);
    resetState();
    onImported();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next && !importing) resetState();
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="min-w-[6rem] flex-1" />
        }
      >
        <Presentation /> Import PPTX
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Presentation className="size-4 text-primary" />
            Import a PowerPoint
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Each text slide becomes a content slide; slides with only a picture
          become a media item. The file is read entirely in this browser —
          nothing is uploaded anywhere.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={`.pptx,${PPTX_MIME}`}
          className="hidden"
          onChange={(event) => {
            const picked = event.target.files?.[0];
            if (picked) handleFile(picked);
            event.target.value = "";
          }}
        />

        {!slides ? (
          <Button disabled={parsing} onClick={() => inputRef.current?.click()}>
            {parsing ? <Loader2 className="animate-spin" /> : <Presentation />}
            {parsing ? "Reading slides…" : "Choose a .pptx file"}
          </Button>
        ) : (
          <>
            <p className="text-xs font-medium text-muted-foreground">
              {slides.length} slide{slides.length === 1 ? "" : "s"} found
            </p>
            <div className="max-h-64 overflow-y-auto rounded-lg border">
              <ul className="divide-y text-sm">
                {slides.map((slide, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 px-3 py-1.5"
                  >
                    <span className="w-6 shrink-0 text-right text-xs text-muted-foreground">
                      {i + 1}
                    </span>
                    {!slide.text.trim() && slide.images.length > 0 ? (
                      <ImageIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    ) : null}
                    <span className="min-w-0 flex-1 truncate">
                      {snippetFor(slide)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <DialogFooter>
          {slides ? (
            <Button
              variant="outline"
              disabled={importing}
              onClick={() => {
                resetState();
                inputRef.current?.click();
              }}
            >
              Choose a different file
            </Button>
          ) : null}
          {slides ? (
            <Button disabled={importing} onClick={handleImport}>
              {importing ? (
                <>
                  <Loader2 className="animate-spin" />
                  {progress
                    ? `Importing slide ${progress.current} of ${progress.total}…`
                    : "Importing…"}
                </>
              ) : (
                `Import ${slides.length} slide${slides.length === 1 ? "" : "s"}`
              )}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
