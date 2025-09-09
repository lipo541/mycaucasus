"use client";
import { useRef, useState } from 'react';

type Props = {
  values: string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
  ariaLabel?: string;
  maxItems?: number;
  allowDuplicates?: boolean;
  inputName?: string; // for a11y/lint: give the inner input a name
};

export function MultiTextInput({ values, onChange, placeholder, ariaLabel, maxItems, allowDuplicates = false, inputName }: Props) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isAscii = (s: string) => /^[\x20-\x7E]*$/.test(s || "");

  const addValue = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    if (!isAscii(v)) return; // silently ignore non-ASCII additions
    if (!allowDuplicates && values.some(x => x.toLowerCase() === v.toLowerCase())) return;
    if (maxItems && values.length >= maxItems) return;
    onChange([...values, v]);
    setDraft("");
  };

  const removeAt = (idx: number) => {
    const next = [...values];
    next.splice(idx, 1);
    onChange(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' ) {
      e.preventDefault();
      addValue(draft);
    } else if (e.key === 'Backspace' && draft === '' && values.length > 0) {
      e.preventDefault();
      removeAt(values.length - 1);
    }
  };

  const handleBlur = () => {
    if (draft.trim()) addValue(draft);
  };

  return (
  <div className="multitext login__input" role="group" aria-label={ariaLabel} onClick={() => inputRef.current?.focus()}>
      {values.map((v, i) => (
        <span key={`${v}-${i}`} className="multitext__chip">
          {v}
          <button type="button" aria-label="წაშლა" onClick={() => removeAt(i)} className="multitext__x">×</button>
        </span>
      ))}
      <input
        ref={inputRef}
        className="multitext__input"
        value={draft}
    onChange={e => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={values.length === 0 ? placeholder : ''}
        aria-label={ariaLabel}
  name={inputName}
    title={draft && !isAscii(draft) ? 'ინგლისურად ჩაწერეთ (ASCII).' : undefined}
      />
    </div>
  );
}
