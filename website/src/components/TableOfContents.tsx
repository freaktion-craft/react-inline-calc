"use client";

import { useEffect, useState } from "react";

const sections = [
  { id: "overview", label: "Overview" },
  { id: "installation", label: "Installation" },
  { id: "demo", label: "Demo" },
  { id: "features", label: "Features" },
  { id: "api", label: "API" },
];

export function TableOfContents() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      // Check if at bottom of page
      const atBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 50;

      if (atBottom) {
        setActiveIndex(sections.length - 1);
        return;
      }

      const sectionElements = sections.map((s) => document.getElementById(s.id));
      const scrollY = window.scrollY + 100;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i];
        if (el && el.offsetTop <= scrollY) {
          setActiveIndex(i);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex flex-col justify-between h-full">
      <div className="flex flex-col gap-6">
        <h1 className="text-base font-medium text-neutral-900">
          react-inline-calc
        </h1>

        <div className="flex gap-2">
          {/* Progress line */}
          <div className="relative w-px bg-neutral-200 self-stretch">
            <div
              className="absolute top-0 left-0 w-full bg-neutral-900 transition-all duration-200"
              style={{
                height: `${((activeIndex + 1) / sections.length) * 100}%`,
              }}
            />
          </div>

          {/* Nav links */}
          <nav className="flex flex-col items-start gap-2 text-sm">
            {sections.map((section, i) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={() => setActiveIndex(i)}
                className={`transition-colors ${
                  i <= activeIndex
                    ? "text-neutral-900"
                    : "text-neutral-400 hover:text-neutral-600"
                }`}
              >
                {section.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <a
          href="https://www.npmjs.com/package/react-inline-calc"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          v0.2.0
        </a>
        <a
          href="https://github.com/freaktion-craft/react-inline-calc"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-start gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
          GitHub
        </a>
      </div>
    </div>
  );
}
