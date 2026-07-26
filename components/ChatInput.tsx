"use client";

import { useRef, useState, type FormEvent } from "react";
import { ImagePlusIcon, XIcon } from "lucide-react";
import { compressImageFile, type CompressedImage } from "@/lib/client/compressImage";

export interface PendingImage extends CompressedImage {
  previewUrl: string;
}

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string, image?: PendingImage) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");
  const [image, setImage] = useState<PendingImage | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed, image ?? undefined);
    setValue("");
    // The sent message keeps this object URL to render its own thumbnail, so
    // only the input's reference to it is cleared here; revoking it now
    // would break that just-sent bubble's image immediately.
    setImage(null);
  }

  function clearImage() {
    setImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("That file isn't an image.");
      return;
    }
    setImageError(null);
    try {
      const compressed = await compressImageFile(file);
      clearImage();
      setImage({ ...compressed, previewUrl: URL.createObjectURL(file) });
    } catch {
      setImageError("Couldn't read that photo. Try a different one.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="sticky bottom-0 flex flex-col gap-2 bg-porcelain px-5 py-4">
      {imageError && (
        <p role="alert" className="font-body text-small text-espresso">
          {imageError}
        </p>
      )}
      {image && (
        <div className="flex items-center gap-2">
          <div className="relative h-14 w-14 overflow-hidden rounded-small border border-brass">
            {/* eslint-disable-next-line @next/next/no-img-element -- a transient
                object URL for a not-yet-uploaded file isn't something next/image needs to optimize */}
            <img src={image.previewUrl} alt="Attached photo preview" className="h-full w-full object-cover" />
          </div>
          <button
            type="button"
            onClick={clearImage}
            aria-label="Remove attached photo"
            className="rounded-full border border-brass p-1.5 text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
          >
            <XIcon className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <label htmlFor="chat-input" className="sr-only">
          Describe an occasion, season, or vibe
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={onFileSelected}
          disabled={disabled}
          aria-label="Attach a photo of a garment"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          aria-label="Attach a photo of a garment"
          title="Attach a photo of a garment"
          className="shrink-0 rounded-full border border-brass p-3 text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool disabled:opacity-50"
        >
          <ImagePlusIcon className="size-5" aria-hidden="true" />
        </button>
        <textarea
          id="chat-input"
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e);
            }
          }}
          placeholder="How can I OutFit you?"
          disabled={disabled}
          className="min-h-[2.75rem] flex-1 resize-none rounded-card border border-brass bg-porcelain px-4 py-3 font-body text-body text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="shrink-0 rounded-pill bg-amber px-5 py-3 font-utility text-utility uppercase text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </form>
  );
}
