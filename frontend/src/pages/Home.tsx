/**
 * Home.tsx — Idea input screen with anime.js entrance animations,
 * three.js particle background, and interactive micro-transitions.
 * API/data flow: unchanged — onSubmit(text) is called exactly as before.
 */
import { useState, useEffect, useRef } from "react";
import { animate } from "animejs";

import BackgroundScene from "../components/BackgroundScene";

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function Home({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const wasEnabled = useRef(false);

  // Refs for animated elements
  const wrapRef    = useRef<HTMLDivElement>(null);
  const titleRef   = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const formRef    = useRef<HTMLDivElement>(null);
  const btnRef     = useRef<HTMLButtonElement>(null);

  // ── Entrance animation on mount ────────────────────────────
  useEffect(() => {
    if (REDUCED) return;
    const els = [subtitleRef.current, titleRef.current, formRef.current];
    if (els.some(el => !el)) return;

    // Start all invisible
    (els as HTMLElement[]).forEach(el => {
      el.style.opacity = "0";
      el.style.transform = "translateY(28px)";
    });

    // Stagger them in with increasing delays
    [[subtitleRef.current, 0], [titleRef.current, 120], [formRef.current, 220]].forEach(
      ([el, delay]) => {
        animate(el as HTMLElement, {
          opacity: [0, 1],
          translateY: [28, 0],
          duration: 700,
          ease: "outExpo",
          delay: delay as number,
        });
      }
    );
  }, []);

  // ── Button pulse once when it becomes enabled ──────────────
  useEffect(() => {
    const isEnabled = !!text.trim();
    if (isEnabled && !wasEnabled.current && btnRef.current && !REDUCED) {
      btnRef.current.classList.add("btn-pulse-once");
      const handle = setTimeout(() =>
        btnRef.current?.classList.remove("btn-pulse-once"), 750);
      return () => clearTimeout(handle);
    }
    wasEnabled.current = isEnabled;
  }, [text]);

  // ── Submit: fade-out the whole panel ──────────────────────
  function handleSubmit() {
    if (!text.trim()) return;
    setSubmitting(true);

    if (REDUCED || !wrapRef.current) {
      onSubmit(text);
      return;
    }

    animate(wrapRef.current, {
      opacity: [1, 0],
      scale: [1, 0.97],
      duration: 380,
      ease: "inCubic",
      onComplete: () => onSubmit(text),
    });
  }

  return (
    <>
      <BackgroundScene activeStage={-1} />

      <div className="app-layer" style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}>
        <div ref={wrapRef} style={{ width: "100%", maxWidth: 620 }}>

          {/* Badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "rgba(0,212,255,0.08)",
            border: "1px solid rgba(0,212,255,0.2)",
            borderRadius: 100,
            padding: "0.3rem 0.9rem",
            fontSize: "0.72rem",
            fontFamily: "var(--font-mono)",
            color: "var(--accent)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "1.5rem",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)",
              animation: "dot-bounce 2s ease-in-out infinite" }} />
            AI Project Idea Validator · Demo Mode
          </div>

          {/* Title — animated in */}
          <h1 ref={titleRef} style={{
            marginBottom: "0.5rem",
            background: "linear-gradient(135deg, #ffffff 30%, var(--accent) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Syrax
          </h1>

          {/* Subtitle — animated in */}
          <p ref={subtitleRef} style={{
            fontSize: "1.05rem",
            color: "var(--text-secondary)",
            marginBottom: "2.5rem",
            maxWidth: 480,
            lineHeight: 1.7,
          }}>
            Describe your project idea. Syrax searches GitHub, academic
            papers, and existing tools to tell you exactly how novel it really is.
          </p>

          {/* Form card — animated in */}
          <div ref={formRef} className="card" style={{ padding: "2rem" }}>
            <label style={{
              display: "block",
              fontSize: "0.78rem",
              fontFamily: "var(--font-mono)",
              color: "var(--text-muted)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "0.75rem",
            }}>
              Your idea
            </label>

            <textarea
              className="syrax-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="e.g. An AI coding assistant that detects security vulnerabilities in real-time using RAG to cross-reference known CVEs..."
              disabled={submitting}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && text.trim()) {
                  handleSubmit();
                }
              }}
            />

            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "1.25rem",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}>
              <span style={{
                fontSize: "0.72rem",
                fontFamily: "var(--font-mono)",
                color: "var(--text-muted)",
              }}>
                {text.length > 0 ? `${text.length} chars · ⌘+Enter to submit` : "⌘+Enter to submit"}
              </span>

              <button
                ref={btnRef}
                className="btn btn-primary"
                disabled={!text.trim() || submitting}
                onClick={handleSubmit}
                id="analyze-btn"
              >
                {submitting ? (
                  <>
                    <span className="spinner-dots" style={{ marginRight: 4 }}>
                      <span /><span /><span />
                    </span>
                    Analyzing…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                    Analyze Idea
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Footer note */}
          <p style={{
            marginTop: "1.5rem",
            fontSize: "0.72rem",
            fontFamily: "var(--font-mono)",
            color: "var(--text-muted)",
            textAlign: "center",
          }}>
            Running in demo mode · 8-stage analysis pipeline · no API keys required
          </p>
        </div>
      </div>
    </>
  );
}
