'use client'

import { useState } from 'react';

export default function CopyButton({ textToCopy, className }: { textToCopy: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className={className || "copy-btn"}
      aria-label="Copiar"
      title="Copiar"
      type="button"
    >
      <i className={`fa-solid ${copied ? 'fa-check text-success m-0' : 'fa-copy'}`}></i>
    </button>
  );
}
