import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';

/**
 * Popover menu: role=menu, arrow/Home/End keys move focus, Esc and outside click
 * close it and return focus to the trigger. No native <details>.
 */
export function Menu({
  label,
  trigger,
  children,
  style,
  sheet
}: {
  label: string;
  trigger: (p: { onClick: () => void; expanded: boolean; ref: (el: HTMLButtonElement | null) => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  style?: CSSProperties;
  /** Render as a bottom sheet (phones) instead of an anchored popover. */
  sheet?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const triggerEl = useRef<HTMLButtonElement | null>(null);

  const close = () => {
    setOpen(false);
    triggerEl.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLElement>('[role^="menuitem"]')?.focus();
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(menu.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? []);
    const i = items.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => {
      e.preventDefault();
      items[(n + items.length) % items.length]?.focus();
    };
    if (e.key === 'ArrowDown') go(i + 1);
    else if (e.key === 'ArrowUp') go(i - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(items.length - 1);
    else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') setOpen(false);
  };

  return (
    <div ref={wrap} className="menu-wrap">
      {trigger({ onClick: () => setOpen((o) => !o), expanded: open, ref: (el) => (triggerEl.current = el) })}
      {open && sheet && <div className="scrim" aria-hidden="true" onMouseDown={() => setOpen(false)} />}
      {open && (
        <div ref={menu} role="menu" aria-label={label} className={sheet ? 'sheet' : 'menu-pop'} style={sheet ? undefined : style} onKeyDown={onKeyDown}>
          {sheet && <span className="sheet-grip" aria-hidden="true" />}
          {children(close)}
        </div>
      )}
    </div>
  );
}
