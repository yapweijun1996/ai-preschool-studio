import { useId, useRef, useState, type ReactNode } from 'react';

function pretty(html: string) {
  return html.replace(/></g, '>\n<').replace(/(\s)(class|style|aria-[\w-]+|role|type|title|data-[\w-]+)=/g, '\n  $2=');
}

export function MarkupExample({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  const example = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState('');
  const [markup, setMarkup] = useState('');
  const toggle = () => {
    if (!open) setMarkup(pretty(example.current?.outerHTML ?? ''));
    setOpen(!open);
  };
  const copy = async () => {
    const value = markup || pretty(example.current?.outerHTML ?? '');
    try {
      await navigator.clipboard.writeText(value);
      setCopied('Markup copied.');
    } catch {
      setCopied('Clipboard unavailable. Select and copy the markup above.');
    }
  };
  return <article className="catalog-example"><div className="catalog-example-head"><h3>{title}</h3><button className="btn btn-secondary" type="button" aria-expanded={open} aria-controls={id} onClick={toggle}>Markup</button></div><div className="catalog-preview" ref={example}>{children}</div><div id={id} className="catalog-code" hidden={!open}><pre><code>{markup}</code></pre><button className="btn btn-secondary" type="button" onClick={copy}>Copy</button>{copied && <span role="status">{copied}</span>}</div></article>;
}
