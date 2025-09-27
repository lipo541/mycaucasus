"use client";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./file-upload.module.css";

type FileUploadProps = {
  id?: string;
  label?: string;
  ariaLabel?: string;
  hint?: string;
  accept?: string;
  multiple?: boolean;
  capture?: string;
  disabled?: boolean;
  maxFiles?: number;
  files: File[];
  onChange: (files: File[]) => void;
};

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`;
}

export function FileUpload({
  id,
  label,
  ariaLabel,
  hint,
  accept,
  multiple,
  capture,
  disabled,
  maxFiles,
  files,
  onChange,
}: FileUploadProps) {
  const autoId = useId();
  const inputId = id || `fu-${autoId}`;
  const dropRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setDragging] = useState(false);

  const addFiles = useCallback(
    (list: FileList | File[]) => {
      const incoming = Array.from(list || []);
      const next = multiple
        ? [...files, ...incoming]
        : ([incoming[0]].filter(Boolean) as File[]);
      const uniqueByNameSize = (arr: File[]) => {
        const seen = new Set<string>();
        return arr.filter((f) => {
          const k = `${f.name}:${f.size}`;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
      };
      const limited = maxFiles
        ? uniqueByNameSize(next).slice(0, maxFiles)
        : uniqueByNameSize(next);
      onChange(limited);
    },
    [files, multiple, onChange, maxFiles]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files || []);
    // reset input so selecting the same file again triggers change
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (disabled) return;
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setDragging(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
  };

  const removeAt = (idx: number) => {
    const next = [...files];
    next.splice(idx, 1);
    onChange(next);
  };

  const previews = useMemo(
    () =>
      files.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        url: f.type.startsWith("image/") ? URL.createObjectURL(f) : "",
      })),
    [files]
  );

  useEffect(
    () => () => {
      previews.forEach((p) => {
        if (p.url) URL.revokeObjectURL(p.url);
      });
    },
    [previews]
  );

  return (
    <div className={styles.wrapper} role="group" aria-label={ariaLabel}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <div
        ref={dropRef}
        className={`${styles.dropzone} ${
          isDragging ? styles.dropzoneDragging : ""
        } ${disabled ? styles.dropzoneDisabled : ""}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => {
          if (!disabled) inputRef.current?.click();
        }}
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        aria-disabled={disabled || undefined}
      >
        <div className={styles.dropContent}>
          <div className={styles.icon}>⬆</div>
          <div className={styles.primaryText}>დააგდეთ ფაილები ან აირჩიეთ</div>
          {hint && <div className={styles.hint}>{hint}</div>}
          <button
            type="button"
            className={styles.chooseBtn}
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            აირჩიეთ ფაილი
          </button>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            className={styles.input}
            accept={accept}
            multiple={!!multiple}
            onChange={onInputChange}
            capture={capture as any}
            disabled={disabled}
          />
        </div>
      </div>
      {files.length > 0 && (
        <ul className={styles.files} aria-live="polite">
          {previews.map((p, i) => (
            <li key={`${p.name}-${i}`} className={styles.fileItem}>
              <div className={styles.thumbWrap}>
                {p.url ? (
                  <img src={p.url} alt="preview" className={styles.thumb} />
                ) : (
                  <div className={styles.fallbackIcon} aria-hidden>
                    PDF
                  </div>
                )}
              </div>
              <div className={styles.meta}>
                <div className={styles.name} title={p.name}>
                  {p.name}
                </div>
                <div className={styles.size}>{formatBytes(p.size)}</div>
              </div>
              <button
                type="button"
                className={styles.removeBtn}
                aria-label={`ფაილის წაშლა: ${p.name}`}
                onClick={() => removeAt(i)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FileUpload;
