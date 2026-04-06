import type { Metadata } from 'next';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'Concord Board',
  description: 'A real-time collaborative whiteboard built with Next.js, Yjs, and WebSockets.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans text-charcoal bg-alabaster antialiased selection:bg-sage/30">
        {children}
      </body>
    </html>
  );
}
