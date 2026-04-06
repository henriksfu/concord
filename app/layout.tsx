import type { Metadata } from 'next';
import { Newsreader, Manrope } from 'next/font/google';
import '@/app/globals.css';

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Concord Board',
  description: 'A real-time collaborative whiteboard built with Next.js, Yjs, and WebSockets.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${newsreader.variable} ${manrope.variable}`}>
      <body className="font-sans text-charcoal bg-alabaster antialiased selection:bg-sage/30">
        {children}
      </body>
    </html>
  );
}
