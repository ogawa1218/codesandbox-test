"use client";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { postAnnouncement } from "./actions";
import { toast } from "sonner";

export function BulletinComposer({ storeId }: { storeId: string }) {
  const [pending, start] = useTransition();
  const [imagePath, setImagePath] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function uploadImage(file: File) {
    const fd = new FormData();
    fd.set("file", file);
    fd.set("bucket", "announcements");
    fd.set("store_id", storeId);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error ?? "アップロードに失敗しました");
    }
    return ((await res.json()) as { path: string }).path;
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        if (imagePath) fd.set("image_path", imagePath);
        start(async () => {
          const r = await postAnnouncement(fd);
          if (!r.ok) {
            toast.error(r.error.message);
          } else {
            toast.success("投稿しました");
            formRef.current?.reset();
            setImagePath(null);
          }
        });
      }}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor="title">タイトル</Label>
        <Input id="title" name="title" required maxLength={80} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="body">本文</Label>
        <Textarea id="body" name="body" required maxLength={2000} rows={4} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="image">画像(任意・最大 5MB / JPEG/PNG/WebP)</Label>
        <Input
          id="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const path = await uploadImage(file);
              setImagePath(path);
              toast.success("画像をアップロードしました");
            } catch (err) {
              toast.error((err as Error).message);
            }
          }}
        />
        {imagePath ? (
          <p className="text-[11px] text-white/50">
            添付済: {imagePath.split("/").pop()}
          </p>
        ) : null}
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "投稿中…" : "投稿する"}
        </Button>
      </div>
    </form>
  );
}
