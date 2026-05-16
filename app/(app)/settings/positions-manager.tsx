"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { archivePosition, savePosition } from "./actions";
import { toast } from "sonner";

interface Position {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  archived: boolean;
}

export function PositionsManager({ initial }: { initial: Position[] }) {
  const [list, setList] = useState(initial);
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState({ name: "", color: "#7c3aed" });

  const submit = (fd: FormData, cb?: () => void) => {
    start(async () => {
      const r = await savePosition(fd);
      if (!r.ok) {
        toast.error(r.error.message);
      } else {
        toast.success("保存しました");
        cb?.();
        location.reload();
      }
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {list
          .filter((p) => !p.archived)
          .map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/2 p-3"
            >
              <span
                className="h-4 w-4 rounded-full ring-2 ring-white/20"
                style={{ background: p.color }}
              />
              <Input
                defaultValue={p.name}
                className="h-8 max-w-[220px]"
                onBlur={(e) => {
                  if (e.target.value !== p.name) {
                    const fd = new FormData();
                    fd.set("id", p.id);
                    fd.set("name", e.target.value);
                    fd.set("color", p.color);
                    fd.set("sort_order", String(p.sort_order));
                    submit(fd);
                  }
                }}
              />
              <Input
                type="color"
                defaultValue={p.color}
                className="h-8 w-12 cursor-pointer p-0"
                onBlur={(e) => {
                  if (e.target.value !== p.color) {
                    const fd = new FormData();
                    fd.set("id", p.id);
                    fd.set("name", p.name);
                    fd.set("color", e.target.value);
                    fd.set("sort_order", String(p.sort_order));
                    submit(fd);
                  }
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                disabled={pending}
                onClick={() => {
                  start(async () => {
                    const r = await archivePosition(p.id);
                    if (r.ok) {
                      setList((s) => s.filter((q) => q.id !== p.id));
                      toast.success("アーカイブしました");
                    }
                  });
                }}
              >
                アーカイブ
              </Button>
            </li>
          ))}
      </ul>

      <form
        className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-white/10 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.name.trim()) return;
          const fd = new FormData();
          fd.set("name", draft.name);
          fd.set("color", draft.color);
          fd.set("sort_order", String(list.length));
          submit(fd, () => setDraft({ name: "", color: "#7c3aed" }));
        }}
      >
        <Input
          placeholder="ポジション名(例: ホール)"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          className="h-9 max-w-[240px]"
          maxLength={40}
        />
        <Input
          type="color"
          value={draft.color}
          onChange={(e) => setDraft({ ...draft, color: e.target.value })}
          className="h-9 w-12 cursor-pointer p-0"
        />
        <Button type="submit" size="sm" disabled={pending}>
          追加
        </Button>
      </form>
    </div>
  );
}
