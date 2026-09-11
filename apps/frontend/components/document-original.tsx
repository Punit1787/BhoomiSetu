"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { StoredDocument } from "@/lib/operations-types";

export function DocumentOriginal({ document }: { document: StoredDocument }) {
  const [opened, setOpened] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!opened) return;
    const controller = new AbortController();
    let objectUrl = "";
    apiFetch<Blob>(`/documents/${document.id}/original?preview=true`, {
      signal: controller.signal,
    })
      .then((blob) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((error: Error) => {
        if (!controller.signal.aborted) setError(error.message);
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [opened, document.id]);
  async function download() {
    try {
      const blob = await apiFetch<Blob>(`/documents/${document.id}/original`);
      const objectUrl = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = objectUrl;
      link.download = document.original_filename || "scan";
      link.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Download failed");
    }
  }
  if (!document.original_filename)
    return (
      <p className="notice">
        Original unavailable for this older upload. Upload a new version to
        retain its scan.
      </p>
    );
  return (
    <section className="originalScan" aria-label="Original document">
      <div className="buttonRow">
        <button
          type="button"
          className="button secondary"
          onClick={() => {
            setError("");
            setUrl("");
            setOpened(!opened);
          }}
        >
          {opened ? "Hide original" : "View original"}
        </button>
        <button
          type="button"
          className="button secondary"
          onClick={() => void download()}
        >
          Download original
        </button>
      </div>
      {opened && !url && !error && <p role="status">Loading original…</p>}
      {opened && url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          aria-label="Open scan at full size"
        >
          {/* Authenticated blob URLs are created locally; Next image optimisation cannot access them. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={`Original scan: ${document.original_filename}`} />
        </a>
      )}
      {opened && url && (
        <p className="helper">
          Select the scan to enlarge it. TIFF preview shows the first page;
          download the original for all pages.
        </p>
      )}
      {error && (
        <p role="alert" className="errorNote">
          {error}
        </p>
      )}
    </section>
  );
}
