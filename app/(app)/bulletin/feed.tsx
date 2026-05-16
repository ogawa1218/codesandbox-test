"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { markRead } from "./actions";

interface Item {
  id: string;
  title: string;
  body: string;
  image_path: string | null;
  pdf_path: string | null;
  author_id: string;
  author_name: string;
  created_at: string;
  is_read: boolean;
}

export function BulletinFeed({
  items: initial,
  storeId,
  userId,
}: {
  items: Item[];
  storeId: string;
  userId: string;
}) {
  const [items, setItems] = useState(initial);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({});

  // Resolve short-lived signed URLs for image (announcements) and PDF (manuals)
  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const imgPaths = items
        .filter((i) => i.image_path)
        .map((i) => i.image_path!);
      if (imgPaths.length) {
        const { data } = await supabase.storage
          .from("announcements")
          .createSignedUrls(imgPaths, 600);
        const map: Record<string, string> = {};
        for (const e of data ?? []) {
          if (e.signedUrl && e.path) map[e.path] = e.signedUrl;
        }
        setSignedUrls(map);
      }
      const pdfPaths = items.filter((i) => i.pdf_path).map((i) => i.pdf_path!);
      if (pdfPaths.length) {
        const { data } = await supabase.storage
          .from("manuals")
          .createSignedUrls(pdfPaths, 600);
        const map: Record<string, string> = {};
        for (const e of data ?? []) {
          if (e.signedUrl && e.path) map[e.path] = e.signedUrl;
        }
        setPdfUrls(map);
      }
    })();
  }, [items]);

  // Realtime — listen for new posts in this store
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`announcements:${storeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "announcements",
          filter: `store_id=eq.${storeId}`,
        },
        async (payload) => {
          const row = payload.new as {
            id: string;
            title: string;
            body: string;
            image_path: string | null;
            pdf_path: string | null;
            author_id: string;
            created_at: string;
          };
          const { data: author } = await supabase
            .from("profiles_public")
            .select("full_name")
            .eq("id", row.author_id)
            .maybeSingle();
          setItems((cur) => [
            {
              ...row,
              author_name: author?.full_name ?? "—",
              is_read: false,
            },
            ...cur,
          ]);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [storeId]);

  // Mark visible un-read items as read on intersection
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const id = (e.target as HTMLElement).dataset.id;
            if (!id) continue;
            const cur = items.find((x) => x.id === id);
            if (cur && !cur.is_read) {
              void markRead(id);
              setItems((arr) =>
                arr.map((x) => (x.id === id ? { ...x, is_read: true } : x)),
              );
            }
          }
        }
      },
      { threshold: 0.5 },
    );
    document
      .querySelectorAll<HTMLElement>("[data-bulletin-card]")
      .forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [items]);

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-white/10 bg-white/2 p-6 text-center text-white/50">
        まだ投稿がありません。
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((it) => (
        <li
          key={it.id}
          data-bulletin-card
          data-id={it.id}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-xl"
        >
          <div className="flex items-center gap-2">
            {!it.is_read ? (
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px] shadow-cyan-400" />
            ) : null}
            <h3 className="text-base font-semibold text-white">{it.title}</h3>
            <span className="ml-auto text-[11px] text-white/40">
              {new Date(it.created_at).toLocaleString("ja-JP", {
                month: "numeric",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <p className="mt-1 text-xs text-white/50">{it.author_name}</p>
          <p className="mt-3 whitespace-pre-wrap text-sm text-white/85">
            {it.body}
          </p>
          {it.image_path && signedUrls[it.image_path] ? (
            // Signed URL is short-lived; safe to render as <img>
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={signedUrls[it.image_path]}
              alt=""
              className="mt-3 max-h-80 w-auto rounded-xl border border-white/10"
            />
          ) : null}
          {it.pdf_path && pdfUrls[it.pdf_path] ? (
            <a
              href={pdfUrls[it.pdf_path]}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-cyan-300 hover:bg-white/10"
            >
              PDF を開く
            </a>
          ) : null}
          {userId ? null : null}
        </li>
      ))}
    </ul>
  );
}
