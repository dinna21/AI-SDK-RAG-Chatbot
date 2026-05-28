"use client";

import {
  AlertCircle,
  CheckCircle2,
  CloudUpload,
  FileText,
  Layers,
  RotateCcw,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useRef, useState, useTransition } from "react";
import { uploadDocument } from "./actions";

type UploadState =
  | { status: "idle" }
  | { status: "selected"; files: File[] }
  | { status: "uploading"; files: File[] }
  | { status: "success"; files: File[]; inserted: number; uploaded: number }
  | { status: "error"; files: File[] | null; message: string };

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function validateFile(file: File): string | null {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    return `Invalid file type "${file.type || file.name}". Only PDF files are accepted.`;
  }

  if (file.size > MAX_SIZE_BYTES) {
    return `File too large (${formatBytes(file.size)}). Maximum size is 10 MB.`;
  }

  return null;
}

export default function UploadPage() {
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFiles = useCallback((incomingFiles: File[]) => {
    if (incomingFiles.length === 0) {
      setState({
        status: "error",
        files: null,
        message: "Select at least one PDF file.",
      });
      return;
    }

    const validationError = incomingFiles.find((file) => validateFile(file));
    const errorMessage = validationError ? validateFile(validationError) : null;

    if (errorMessage) {
      setState({ status: "error", files: null, message: errorMessage });
      return;
    }

    setState({ status: "selected", files: incomingFiles });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) pickFiles(files);
    e.target.value = "";
  };

  const handleDragLeave = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length > 0) pickFiles(files);
  };

  const handleSubmit = () => {
    if (state.status !== "selected" || isPending) return;
    const files = state.files;
    setState({ status: "uploading", files });
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }
    startTransition(async () => {
      try {
        const result = await uploadDocument(formData);
        setState({
          status: "success",
          files,
          inserted: result.inserted,
          uploaded: result.files ?? files.length,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred.";
        setState({ status: "error", files, message });
      }
    });
  };

  const handleReset = () => {
    setState({ status: "idle" });
    setIsDragging(false);
  };

  const isUploading = state.status === "uploading" || isPending;
  const isSuccess = state.status === "success";
  const selectedFiles =
    state.status === "selected" ||
    state.status === "uploading" ||
    state.status === "success"
      ? state.files
      : state.status === "error" && state.files !== null
        ? state.files
        : [];
  const firstSelectedFile = selectedFiles[0] ?? null;

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes indeterminate {
          0%   { transform: translateX(-100%) scaleX(0.4); }
          50%  { transform: translateX(0%)    scaleX(0.6); }
          100% { transform: translateX(100%)  scaleX(0.4); }
        }
        @keyframes successPop {
          0%   { transform: scale(0.85); opacity: 0; }
          60%  { transform: scale(1.05); }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        .animate-slide-up  { animation: slideUp 0.35s ease-out both; }
        .animate-fade-in   { animation: fadeIn 0.25s ease-out both; }
        .animate-success   { animation: successPop 0.4s cubic-bezier(.34,1.56,.64,1) both; }
        .animate-float     { animation: float 3s ease-in-out infinite; }
        .progress-bar      { animation: indeterminate 1.6s ease-in-out infinite; transform-origin: left; }
      `}</style>

      <main className="flex min-h-screen items-center justify-center bg-[#07090d] px-4 py-16">
        {/* Ambient glows */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/4 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.05] blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-cyan-500/[0.04] blur-3xl" />
        </div>

        <div className="relative w-full max-w-lg animate-slide-up">
          {/* Card */}
          <div className="rounded-2xl border border-white/[0.07] bg-[#0c1018] shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
            {/* Header */}
            <div className="border-b border-white/[0.06] px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/15 to-cyan-400/10 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.1)]">
                  <CloudUpload className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-base font-semibold tracking-tight text-white">
                    Upload Document
                  </h1>
                  <p className="text-xs text-zinc-500">
                    PDF only · max 10 MB each · upload one or many documents at
                    once
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-6">
              {/* ── Success state (replaces drop zone) ── */}
              {isSuccess ? (
                <div className="animate-success flex flex-col items-center gap-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] px-6 py-10 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-300 shadow-[0_0_32px_rgba(52,211,153,0.15)]">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-emerald-300">
                      Embedded successfully
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      <span className="font-medium text-zinc-300">
                        {(state as { inserted: number }).inserted}
                      </span>{" "}
                      chunk
                      {(state as { inserted: number }).inserted !== 1
                        ? "s"
                        : ""}{" "}
                      added to your knowledge base
                    </p>
                  </div>
                  {firstSelectedFile && (
                    <div className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-[#0f1620] px-3 py-2 text-xs text-zinc-400">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-emerald-400/70" />
                      <span className="max-w-[220px] truncate">
                        {firstSelectedFile.name}
                      </span>
                      <span className="text-zinc-600">·</span>
                      <span>{formatBytes(firstSelectedFile.size)}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Drop zone ── */
                <button
                  type="button"
                  aria-label="Click or drag and drop a PDF file to select it"
                  onDragOver={!isUploading ? handleDragOver : undefined}
                  onDragLeave={!isUploading ? handleDragLeave : undefined}
                  onDrop={!isUploading ? handleDrop : undefined}
                  onClick={() => !isUploading && inputRef.current?.click()}
                  disabled={isUploading}
                  className={[
                    "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all duration-200 outline-none",
                    isUploading
                      ? "cursor-not-allowed border-white/[0.05] bg-white/[0.02]"
                      : isDragging
                        ? "cursor-copy border-emerald-400/50 bg-emerald-400/[0.06] shadow-[0_0_32px_rgba(52,211,153,0.08)]"
                        : "cursor-pointer border-white/[0.08] bg-white/[0.02] hover:border-emerald-400/35 hover:bg-emerald-400/[0.04] focus-visible:border-emerald-400/50 focus-visible:ring-2 focus-visible:ring-emerald-400/20",
                  ].join(" ")}
                >
                  {/* Upload icon */}
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-300 ${
                      isDragging
                        ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300 shadow-[0_0_24px_rgba(52,211,153,0.15)] animate-float"
                        : "border-white/[0.08] bg-white/[0.04] text-zinc-500"
                    }`}
                  >
                    <Upload className="h-6 w-6" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-300">
                      <span className="text-emerald-400">Browse file</span> or
                      drag &amp; drop
                    </p>
                    <p className="text-xs text-zinc-600">
                      PDF documents up to 10 MB each
                    </p>
                  </div>

                  {/* Drag overlay label */}
                  {isDragging && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl">
                      <span className="rounded-xl bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-400/25">
                        Drop to select
                      </span>
                    </div>
                  )}

                  <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept="application/pdf"
                    className="sr-only"
                    aria-hidden="true"
                    tabIndex={-1}
                    disabled={isUploading}
                    onChange={handleInputChange}
                  />
                </button>
              )}

              {/* ── Selected files card ── */}
              {selectedFiles.length > 0 && !isSuccess && (
                <div
                  aria-live="polite"
                  className="animate-fade-in flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#0f1620] px-4 py-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-400/20 bg-red-400/10 text-red-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-200">
                      {selectedFiles.length === 1
                        ? selectedFiles[0].name
                        : `${selectedFiles.length} PDF files selected`}
                    </p>
                    <p className="text-xs text-zinc-600">
                      {selectedFiles.length === 1
                        ? formatBytes(selectedFiles[0].size)
                        : `${selectedFiles.reduce((total, file) => total + file.size, 0)}`}
                    </p>
                  </div>
                  {!isUploading && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="shrink-0 rounded-md p-1.5 text-zinc-600 transition hover:bg-white/[0.06] hover:text-zinc-300"
                      aria-label="Remove selected files"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* ── Progress bar ── */}
              {isUploading && (
                <div aria-live="polite" className="animate-fade-in space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-emerald-400/70" />
                      Chunking &amp; embedding…
                    </span>
                    <span className="text-zinc-600">Please wait</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="progress-bar h-full w-3/5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
                  </div>
                </div>
              )}

              {/* ── Error banner ── */}
              {state.status === "error" && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="animate-fade-in flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <p className="flex-1 text-sm text-red-300">{state.message}</p>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="shrink-0 rounded-md p-1 text-red-500 transition hover:bg-red-400/10 hover:text-red-300"
                    aria-label="Dismiss error"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* ── Action buttons ── */}
              <div className="flex gap-2.5 pt-1">
                {!isSuccess ? (
                  <>
                    <button
                      type="button"
                      disabled={state.status !== "selected" || isUploading}
                      onClick={handleSubmit}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-[0_4px_14px_rgba(52,211,153,0.2)] transition-all duration-200 hover:brightness-110 hover:shadow-[0_4px_20px_rgba(52,211,153,0.35)] focus-visible:ring-2 focus-visible:ring-emerald-400/60 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                    >
                      {isUploading ? (
                        <>
                          <span className="h-4 w-4 rounded-full border-2 border-zinc-950/30 border-t-zinc-950 animate-spin" />
                          Uploading…
                        </>
                      ) : (
                        <>
                          <CloudUpload className="h-4 w-4" />
                          Upload Documents
                        </>
                      )}
                    </button>

                    {state.status !== "idle" && (
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={handleReset}
                        className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-zinc-400 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all duration-200 hover:border-emerald-400/25 hover:bg-emerald-400/[0.06] hover:text-white"
                  >
                    <CloudUpload className="h-4 w-4" />
                    Upload more documents
                  </button>
                )}
              </div>
            </div>

            {/* Footer hint */}
            <div className="border-t border-white/[0.06] px-6 py-3">
              <p className="text-center text-[11px] text-zinc-600">
                Documents are chunked, embedded, and stored together in your
                knowledge base.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
