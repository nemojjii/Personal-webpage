/**
 * A download link that only renders when a real file has been added.
 * Nothing on this site ever links to a file that does not exist.
 */
export function Attachment({
  href,
  label = "Download PDF",
  note,
}: {
  href?: string | null;
  label?: string;
  note?: string;
}) {
  if (!href) return null;
  return (
    <a
      href={href}
      className="no-print group inline-flex items-center gap-2.5 border border-rule px-4 py-2
                 font-sans text-[0.8125rem] text-ink transition-colors duration-200
                 hover:border-accent hover:text-accent"
      download
    >
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        className="h-3.5 w-3.5 text-ink-muted transition-colors duration-200 group-hover:text-accent"
      >
        <path
          d="M8 1v9m0 0 3.2-3.2M8 10 4.8 6.8M1.5 13.5h13"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      </svg>
      {label}
      {note ? <span className="text-ink-muted">· {note}</span> : null}
    </a>
  );
}
