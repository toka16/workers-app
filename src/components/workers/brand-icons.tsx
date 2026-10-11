import type { SVGProps } from "react";

// Minimal brand glyphs (lucide doesn't ship brand logos).
export function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  );
}

export function ViberIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M11.9 2.5c-3.4 0-6.9.6-8.1 3.3-.8 1.8-.9 4.2-.7 6.4.2 2.4 1 4.5 3.4 5.5v3.3l2.9-2.9c3 .2 6.2-.1 8.5-1.3 2.3-1.2 3.1-3.9 3.1-7 0-3.4-.7-5.7-3.3-6.6-1.6-.6-3.7-.7-5.8-.7Z" />
      <path d="M9.2 7.6c.4-.3.9-.3 1.1.1l.8 1.3c.2.4.1.8-.2 1l-.5.4c.4 1.2 1.3 2.1 2.5 2.6l.4-.5c.3-.3.7-.4 1-.2l1.3.8c.4.2.4.7.1 1.1-.6.8-1.6 1-2.5.6a8 8 0 0 1-4.3-4.4c-.3-1 0-2.1.3-2.8Z" />
    </svg>
  );
}

export function TelegramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M21.5 3.6 2.9 10.8c-1.3.5-1.2 1.2-.2 1.5l4.8 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.4l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.9-1.4-1.5Zm-3.4 4-8.6 7.8-.3 3.5-1.6-5 10.1-6.4c.5-.3.9 0 .4.1Z" />
    </svg>
  );
}

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M13.5 21.9v-7.4H16l.4-3h-2.9V9.6c0-.8.3-1.4 1.5-1.4h1.5V5.5a19 19 0 0 0-2.2-.1c-2.2 0-3.7 1.3-3.7 3.8v2.3H8v3h2.6v7.4a10 10 0 1 1 2.9 0Z" />
    </svg>
  );
}
