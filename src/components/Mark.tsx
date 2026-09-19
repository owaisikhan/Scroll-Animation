/** Original wordmark glyph — two offset quarter-rounds forming a soft "V". */
export default function Mark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="mark-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c5cff" />
          <stop offset="100%" stopColor="#2dd4bf" />
        </linearGradient>
        <linearGradient id="mark-b" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f6b93b" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      <path d="M4 4h9a9 9 0 0 1 0 18H4Z" fill="url(#mark-a)" />
      <path d="M14 10h5a9 9 0 0 1 0 18h-5Z" fill="url(#mark-b)" opacity="0.92" />
    </svg>
  );
}
