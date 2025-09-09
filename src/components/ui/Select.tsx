"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./select.css";

type Option = { value: string; label: string };

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  options: Option[];
  disabled?: boolean;
  ariaLabel?: string;
};

export function Select({ value, onChange, placeholder = "აირჩიე", options, disabled, ariaLabel }: Props) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const selectedIndex = useMemo(() => options.findIndex(o => o.value === value), [options, value]);
  const [activeIndex, setActiveIndex] = useState(() => (selectedIndex >= 0 ? selectedIndex : 0));

  useEffect(() => setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0), [selectedIndex]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick, true);
    return () => document.removeEventListener("mousedown", onDocClick, true);
  }, [open]);

  useEffect(() => {
    if (open && listRef.current) {
      // Scroll active item into view
      const el = listRef.current.querySelector(`[data-index='${activeIndex}']`) as HTMLElement | null;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [open, activeIndex]);

  const selectedLabel = useMemo(() => options.find(o => o.value === value)?.label, [options, value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "Escape") { setOpen(false); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex(i => Math.min(options.length - 1, i + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex(i => Math.max(0, i - 1)); }
    if (e.key === "Enter") { e.preventDefault(); const opt = options[activeIndex]; if (opt) { onChange(opt.value); setOpen(false); } }
  };

  return (
    <div className="select2" data-open={open ? "true" : "false"}>
      <button
        type="button"
        ref={btnRef}
        className="select2__control login__input"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        onKeyDown={handleKeyDown}
      >
        <span className={`select2__value ${!selectedLabel ? "select2__placeholder" : ""}`}>
          {selectedLabel || placeholder}
        </span>
        <span className="select2__arrow" aria-hidden="true" />
      </button>
      {open && (
        <div className="select2__dropdown" role="listbox" ref={listRef} tabIndex={-1}>
      <ul className="select2__list">
            {options.map((opt, i) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                className={`select2__option ${i === activeIndex ? "is-active" : ""} ${opt.value === value ? "is-selected" : ""}`}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                data-index={i}
              >
        <span className="select2__check" aria-hidden="true" />
        <span className="select2__label">{opt.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
