"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { decode } from "blurhash";
import { Overview } from "@/components/Overview";
import { Installation } from "@/components/Installation";
import { Demo } from "@/components/Demo";
import { Features } from "@/components/Features";
import { API } from "@/components/API";
import { Footer } from "@/components/Footer";
import { TableOfContents } from "@/components/TableOfContents";

const DEMO_BLURHASH = "L9NTzYf400xv%MRiWAof00t8~qWA";

function DemoVideo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = 32;
    const h = Math.round(32 * (1080 / 3336));
    canvas.width = w;
    canvas.height = h;
    const pixels = decode(DEMO_BLURHASH, w, h);
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.createImageData(w, h);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);
  }, []);

  // Check if video already loaded before React hydrated
  useEffect(() => {
    const video = videoRef.current;
    if (video && video.readyState >= 2) setLoaded(true);
  }, []);

  return (
    <div className="relative w-full rounded-lg border border-neutral-200 mb-16 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full transition-opacity duration-[1400ms] pointer-events-none z-10"
        style={{ opacity: loaded ? 0 : 1 }}
      />
      <video
        ref={videoRef}
        src="/demo.mp4"
        autoPlay
        loop
        muted
        playsInline
        onLoadedData={() => setLoaded(true)}
        className="block w-full"
      />
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="flex min-h-screen">
        {/* Left 30% - Table of Contents */}
        <div className="w-[30%] flex justify-start p-8 pt-[15vh] sticky top-0 h-screen min-[1200px]:pl-[10vw]">
          <TableOfContents />
        </div>

        {/* Right 70% - Main Content */}
        <div className="w-[70%] max-w-[900px] pt-[15vh] pb-16 pr-16 relative">
          {/* Fade overlay */}
          <div
            className="fixed top-0 left-0 w-screen h-32 backdrop-blur-[6px] pointer-events-none z-10"
            style={{
              maskImage: "linear-gradient(to bottom, black 0%, rgba(0,0,0,0.987) 8.1%, rgba(0,0,0,0.951) 15.5%, rgba(0,0,0,0.896) 22.5%, rgba(0,0,0,0.825) 29%, rgba(0,0,0,0.741) 35.3%, rgba(0,0,0,0.648) 41.2%, rgba(0,0,0,0.55) 47.1%, rgba(0,0,0,0.45) 52.9%, rgba(0,0,0,0.352) 58.8%, rgba(0,0,0,0.259) 64.7%, rgba(0,0,0,0.175) 71%, rgba(0,0,0,0.104) 77.5%, rgba(0,0,0,0.049) 84.5%, rgba(0,0,0,0.013) 91.9%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 0%, rgba(0,0,0,0.987) 8.1%, rgba(0,0,0,0.951) 15.5%, rgba(0,0,0,0.896) 22.5%, rgba(0,0,0,0.825) 29%, rgba(0,0,0,0.741) 35.3%, rgba(0,0,0,0.648) 41.2%, rgba(0,0,0,0.55) 47.1%, rgba(0,0,0,0.45) 52.9%, rgba(0,0,0,0.352) 58.8%, rgba(0,0,0,0.259) 64.7%, rgba(0,0,0,0.175) 71%, rgba(0,0,0,0.104) 77.5%, rgba(0,0,0,0.049) 84.5%, rgba(0,0,0,0.013) 91.9%, transparent 100%)",
            }}
          />
          <div
            className="fixed top-0 left-0 w-screen h-32 pointer-events-none z-10"
            style={{
              background: "linear-gradient(to bottom, rgb(250 250 250) 0%, rgba(250, 250, 250, 0.987) 8.1%, rgba(250, 250, 250, 0.951) 15.5%, rgba(250, 250, 250, 0.896) 22.5%, rgba(250, 250, 250, 0.825) 29%, rgba(250, 250, 250, 0.741) 35.3%, rgba(250, 250, 250, 0.648) 41.2%, rgba(250, 250, 250, 0.55) 47.1%, rgba(250, 250, 250, 0.45) 52.9%, rgba(250, 250, 250, 0.352) 58.8%, rgba(250, 250, 250, 0.259) 64.7%, rgba(250, 250, 250, 0.175) 71%, rgba(250, 250, 250, 0.104) 77.5%, rgba(250, 250, 250, 0.049) 84.5%, rgba(250, 250, 250, 0.013) 91.9%, transparent 100%)",
            }}
          />

          <section id="overview">
            <Overview />
            <DemoVideo />
          </section>
          <section id="installation">
            <Installation />
          </section>
          <section id="demo">
            <Demo />
          </section>
          <section id="features">
            <Features />
          </section>
          <section id="api">
            <API />
          </section>
        </div>
      </div>
    </main>
  );
}
