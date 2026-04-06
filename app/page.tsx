'use client';

import Link from 'next/link';
import { generateRoomId } from '@/lib/room';
import CanvasMockupHero from '@/components/canvasMockup';
import FeatureGrid from '@/components/featureGrid';

export default function HomePage() {
  const freshRoomId = generateRoomId('whiteboard');

  return (
    <main className="relative min-h-screen bg-[#F9F9F8] text-charcoal selection:bg-terra/30 selection:text-charcoal font-sans overflow-x-hidden">

      {/* Dense Dot Grid Background */}
      <div className="absolute inset-0 z-0 opacity-[0.4] mix-blend-multiply pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at center, #1A1817 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      {/* Floating Animated Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none mix-blend-multiply opacity-60">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-sage/30 to-transparent blur-[100px] animate-float-slow" />
        <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-bl from-terra/20 to-transparent blur-[120px] animate-float-medium" />
        <div className="absolute bottom-[-20%] left-[30%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-sand/90 to-transparent blur-[150px] animate-float-fast" />
      </div>

      {/* Navbar with Microinteractions */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 md:px-12 animate-fade-in-up">
        <Link href="/" className="font-serif text-2xl font-bold tracking-tight flex items-center gap-3 group">
          <div className="relative w-8 h-8 rounded-lg bg-charcoal overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105 group-active:scale-95">
            <div className="absolute inset-0 bg-gradient-to-tr from-sage/50 to-terra/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-3 h-3 bg-white rounded-full relative z-10 animate-pulse" />
          </div>
          <span className="group-hover:text-terra transition-colors duration-300">Concord</span>
        </Link>
        <div className="hidden md:flex items-center space-x-1 border border-border/80 bg-white/50 backdrop-blur-md rounded-full p-1.5 shadow-sm">
          {['Product', 'Solutions', 'Resources', 'Pricing'].map((item) => (
            <Link key={item} href="#" className="px-5 py-2 rounded-full text-sm font-semibold text-muted hover:text-charcoal hover:bg-white hover:shadow-sm transition-all duration-300">
              {item}
            </Link>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          <Link href="#" className="hidden md:block text-sm font-bold text-muted hover:text-charcoal transition-colors">Log In</Link>
          <Link href={`/room/${freshRoomId}`} className="group relative overflow-hidden rounded-full bg-charcoal px-6 py-2.5 text-sm font-bold text-white shadow-float-sm transition-all hover:scale-105 active:scale-95">
            <span className="relative z-10 flex items-center gap-2">
              Start Free
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-sage to-terra opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out" />
          </Link>
        </div>
      </nav>

      <div className="relative z-10 mx-auto max-w-[1440px] px-4 pt-6 pb-32 md:px-8 md:pt-12 lg:pt-16">        {/* Dynamic Hero Section */}
        <section className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <h1 className="font-serif text-[4rem] md:text-[6.5rem] leading-[1.25] tracking-tight text-charcoal animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Think <span className="relative inline-block group cursor-default text-sage transition-colors duration-300 hover:text-terra">
              <span className="relative z-10 italic">visually.</span>
              <span className="absolute -bottom-2 left-0 w-0 h-1.5 bg-terra transition-all duration-300 group-hover:w-full rounded-full"></span>
            </span><br />
            Work globally.
          </h1>

          <p className="mt-8 max-w-2xl text-lg text-muted md:text-xl font-medium leading-relaxed animate-fade-in-up drop-shadow-[0_0_12px_rgba(249,249,248,1)]" style={{ animationDelay: '300ms' }}>
            <span className="bg-white/40 drop-shadow-md rounded-lg py-1 px-2 leading-[2.2]">The infinite multiplayer canvas for brilliant teams to map out ideas, diagram systems, and build things that matter.</span>
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <JoinRoomForm />
          </div>
        </section>

        {/* Highly Dense & Interactive Mockup Graphic */}
        <section className="mt-20 md:mt-32 relative mx-auto max-w-6xl animate-fade-in-up">
          <CanvasMockupHero />
        </section>


        {/* Feature Grid with Detailed Hover States */}
        <section className="mt-24 md:mt-32 max-w-6xl mx-auto">
          <FeatureGrid />
        </section>

      </div>

      {/* Required style overrides for specific micro keyframes */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes dash {
          to { stroke-dashoffset: -8; }
        }
      `}} />
    </main>
  );
}

function JoinRoomForm() {
  const whiteboardRoomId = generateRoomId('whiteboard');
  const codeRoomId = generateRoomId('code');

  return (
    <form action="/room" className="group">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center w-[330px] border border-transparent transition-all duration-300 ease-out focus-within:w-[360px] hover:w-[350px]">
          <input
            id="roomId"
            name="roomId"
            placeholder="Enter room code to join..."
            required
            className="peer w-full rounded-full border-2 border-border/80 bg-white/70 backdrop-blur-md px-6 py-4 pl-6 pr-[110px] text-[1rem] font-bold text-charcoal outline-none shadow-sm transition-all focus:bg-white focus:border-charcoal focus:ring-4 focus:ring-charcoal/10 placeholder:text-muted/50 placeholder:font-medium"
          />
          <button
            formAction="/room"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-charcoal px-6 py-3 text-sm font-bold tracking-wide text-white transition-all shadow-sm hover:bg-black peer-focus:bg-terra peer-focus:shadow-[0_0_15px_rgba(227,138,112,0.4)]"
          >
            Join
          </button>
        </div>

        <details className="relative">
          <summary className="list-none cursor-pointer rounded-full border-2 border-charcoal/20 bg-white/75 px-5 py-3 text-sm font-bold text-charcoal shadow-sm transition hover:border-charcoal hover:bg-white">
            Start Collaborating
          </summary>
          <div className="absolute right-0 z-50 mt-2 w-52 rounded-2xl border border-charcoal/15 bg-white/95 p-2 shadow-lg backdrop-blur">
            <Link
              href={`/room/${whiteboardRoomId}`}
              className="block rounded-xl px-3 py-2 text-sm font-semibold text-charcoal transition hover:bg-sand/50"
            >
              Whiteboard
            </Link>
            <Link
              href={`/room/${codeRoomId}`}
              className="block rounded-xl px-3 py-2 text-sm font-semibold text-charcoal transition hover:bg-sand/50"
            >
              Code
            </Link>
          </div>
        </details>
      </div>
    </form>
  );
}
