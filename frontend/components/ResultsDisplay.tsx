"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./ResultsDisplay.module.css";
import { runAudit } from "@/lib/audit";
import type { AuditResponse } from "@/lib/audit";

export type AuditResult = AuditResponse;



export default function ResultsDisplay() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);

  const canRun = useMemo(() => url.trim().length > 0 && !loading, [url, loading]);

  async function onRun() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await runAudit(url.trim());
      setResult(res);
    } catch (e: any) {
      setError(e?.message ?? "Audit failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // default value for convenience
    if (!url) setUrl("https://example.com");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className={styles.wrap}>
      <div className="container">
        <div className={styles.card}>
          <h1 className={styles.title}>Site Audit</h1>
          <p className={styles.subtitle}>Run security, performance, SEO, SSL, and tech-stack checks.</p>

          <div className={styles.formRow}>
            <label className={styles.label} htmlFor="url">
              URL
            </label>
            <input
              id="url"
              className={styles.input}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-site.com"
            />
          </div>

          <div className={styles.actions}>
            <button className={styles.button} disabled={!canRun} onClick={onRun}>
              {loading ? "Running..." : "Run Audit"}
            </button>
          </div>

          {error && <div className={styles.errorBox}>Error: {error}</div>}

          {result && (
            <div className={styles.results}>
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Summary</h2>
                <pre className={styles.pre}>{JSON.stringify(result, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
