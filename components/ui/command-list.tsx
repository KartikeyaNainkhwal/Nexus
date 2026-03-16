import React, { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Heading1, Heading2, List, ListOrdered, CheckSquare, Quote, Code, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  "Heading 1": Heading1,
  "Heading 2": Heading2,
  "Bullet List": List,
  "Numbered List": ListOrdered,
  "Task List": CheckSquare,
  Blockquote: Quote,
  "Code Block": Code,
};

interface CommandItem {
  title: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  command: (props: { editor: any; range: any }) => void;
}

export interface CommandListProps {
  items: CommandItem[];
  command: (item: CommandItem) => void;
}

export interface CommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const CommandList = forwardRef<CommandListRef, CommandListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }

      if (event.key === "ArrowDown") {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }

      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="z-50 w-64 overflow-hidden rounded-lg border border-white/10 bg-[#0f0f1a]/95 backdrop-blur-xl shadow-2xl p-1">
      {props.items.length ? (
        props.items.map((item, index) => {
          const Icon = ICONS[item.title];
          return (
            <button
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                index === selectedIndex
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
              )}
              key={index}
              onClick={() => selectItem(index)}
            >
              <div className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md border border-white/10",
                index === selectedIndex ? "bg-white/10" : "bg-white/5"
              )}>
                {Icon && <Icon className="h-4 w-4" />}
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{item.title}</span>
                <span className={cn(
                  "text-[10px]",
                  index === selectedIndex ? "text-white/70" : "text-text-muted"
                )}>
                  {item.description}
                </span>
              </div>
            </button>
          );
        })
      ) : (
        <div className="px-2 py-1.5 text-sm text-text-muted">No results found</div>
      )}
    </div>
  );
});

CommandList.displayName = "CommandList";
