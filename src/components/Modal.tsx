import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type RefObject } from 'react';

type Props = {
  labelledBy: string;
  describedBy?: string;
  onClose: () => void;
  children: ReactNode;
  backdropClassName: string;
  panelClassName: string;
  fallbackFocusRef?: RefObject<HTMLElement | null>;
};

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Accessible modal shell shared by form, confirmation, and report dialogs. */
export function Modal({ labelledBy, describedBy, onClose, children, backdropClassName, panelClassName, fallbackFocusRef }: Props) {
  const panel = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = panel.current?.querySelector<HTMLElement>(FOCUSABLE);
    (focusable ?? panel.current?.querySelector<HTMLElement>('h1, h2, h3') ?? panel.current)?.focus();

    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
      }
    };
    document.addEventListener('keydown', onDocumentKeyDown);
    return () => {
      document.removeEventListener('keydown', onDocumentKeyDown);
      if (trigger?.isConnected) trigger.focus();
      else if (fallbackFocusRef?.current?.isConnected) fallbackFocusRef.current.focus();
    };
  }, [fallbackFocusRef]);

  const trapTab = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab' || !panel.current) return;
    const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((item) => item.getAttribute('aria-hidden') !== 'true');
    if (!items.length) {
      event.preventDefault();
      panel.current.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && (document.activeElement === first || !panel.current.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !panel.current.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className={backdropClassName} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section
        ref={panel}
        className={panelClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        onKeyDown={trapTab}
      >
        {children}
      </section>
    </div>
  );
}
