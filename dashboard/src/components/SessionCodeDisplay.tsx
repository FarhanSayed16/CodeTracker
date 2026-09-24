import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { clsx } from 'clsx';
import './SessionCodeDisplay.css';

interface SessionCodeDisplayProps {
  code: string;
  className?: string;
  /** Compact inline strip for live session toolbar */
  size?: 'md' | 'sm';
  /** Hide the copy button label text when compact */
  showCopyLabel?: boolean;
}

export const SessionCodeDisplay: React.FC<SessionCodeDisplayProps> = ({
  code,
  className,
  size = 'md',
  showCopyLabel = true,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className={clsx('session-code-display', `session-code-${size}`, className)}>
      <div className="session-code-chars" aria-label={`Session code ${code}`}>
        {code.split('').map((char, i) => (
          <span
            key={`${char}-${i}`}
            className="session-code-char"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            {char}
          </span>
        ))}
      </div>
      <button type="button" className="session-code-copy" onClick={handleCopy} title="Copy session code">
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {showCopyLabel && <span>{copied ? 'Copied' : 'Copy'}</span>}
      </button>
    </div>
  );
};
