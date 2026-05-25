"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { uploadDocument } from "./actions";

type UploadState =
  | { status: "idle" }
  | { status: "selected"; file: File }
  | { status: "uploading"; file: File }
  | { status: "success"; file: File; inserted: number }
  | { status: "error"; file: File | null; message: string };

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function validateFile(file: File): string | null {
  if (file.type !== "application/pdf") {
    return `Invalid file type "${file.type}". Only PDF files are accepted.`;
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `File is too large (${formatBytes(file.size)}). Maximum size is 10 MB.`;
  }
  return null;
}

export default function UploadPage() {
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setState({ status: "error", file: null, message: error });
    } else {
      setState({ status: "selected", file });
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) pickFile(file);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) pickFile(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  const handleSubmit = () => {
    if (state.status !== "selected" || isPending) return;
    const file = state.file;

    setState({ status: "uploading", file });

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      try {
        const result = await uploadDocument(formData);
        setState({ status: "success", file, inserted: result.inserted });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred.";
        setState({ status: "error", file, message });
      }
    });
  };

  const handleReset = () => {
    setState({ status: "idle" });
    setIsDragging(false);
  };

  const isUploading = state.status === "uploading" || isPending;
  const selectedFile =
    state.status === "selected" ||
    state.status === "uploading" ||
    state.status === "success" ||
    (state.status === "error" && state.file !== null)
      ? (state as { file: File }).file
      : null;

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-md p-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">
            Upload Document
          </h1>
          <p className="text-sm text-gray-500">
            PDF only · max 10 MB · chunks will be embedded and stored.
          </p>
        </div>

        {/* Drop zone */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Click or drag and drop a PDF file here to select it"
          aria-disabled={isUploading}
          onDragOver={!isUploading ? handleDragOver : undefined}
          onDragLeave={!isUploading ? handleDragLeave : undefined}
          onDrop={!isUploading ? handleDrop : undefined}
          onClick={() => !isUploading && inputRef.current?.click()}
          onKeyDown={!isUploading ? handleKeyDown : undefined}
          className={[
            "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
            isUploading
              ? "cursor-not-allowed border-gray-200 bg-gray-50"
              : isDragging
                ? "cursor-copy border-blue-500 bg-blue-50"
                : "cursor-pointer border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          ].join(" ")}
        >
          <svg
            aria-hidden="true"
            className={`h-10 w-10 ${isDragging ? "text-blue-500" : "text-gray-400"}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16.5v-9m0 0-3 3m3-3 3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
            />
          </svg>

          <div>
            <span className="font-medium text-blue-600">Browse file</span>
            <span className="text-gray-500"> or drag &amp; drop</span>
          </div>
          <p className="text-xs text-gray-400">PDF up to 10 MB</p>

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
            disabled={isUploading}
            onChange={handleInputChange}
          />
        </div>

        {/* Selected file info */}
        {selectedFile && (
          <div
            className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
            aria-live="polite"
          >
            <svg
              aria-hidden="true"
              className="mt-0.5 h-6 w-6 shrink-0 text-red-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
              />
            </svg>
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="truncate text-sm font-medium text-gray-800">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {selectedFile.type || "application/pdf"} ·{" "}
                {formatBytes(selectedFile.size)}
              </p>
            </div>
          </div>
        )}

        {/* Progress bar */}
        {isUploading && (
          <div aria-live="polite" aria-label="Uploading…">
            <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
              <span>Uploading &amp; embedding…</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-full animate-[progress_1.5s_ease-in-out_infinite] rounded-full bg-blue-500" />
            </div>
            <style>{`
              @keyframes progress {
                0%   { width: 0%;   margin-left: 0; }
                50%  { width: 70%;  margin-left: 15%; }
                100% { width: 0%;   margin-left: 100%; }
              }
            `}</style>
          </div>
        )}

        {/* Success banner */}
        {state.status === "success" && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-green-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium">
              Inserted {state.inserted} chunk
              {state.inserted !== 1 ? "s" : ""} successfully.
            </span>
          </div>
        )}

        {/* Error banner */}
        {state.status === "error" && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800"
          >
            <svg
              aria-hidden="true"
              className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm">{state.message}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            disabled={state.status !== "selected" || isUploading}
            onClick={handleSubmit}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? "Uploading…" : "Upload"}
          </button>

          {state.status !== "idle" && (
            <button
              type="button"
              disabled={isUploading}
              onClick={handleReset}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

