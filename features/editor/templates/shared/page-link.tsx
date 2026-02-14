'use client';

interface PageLinkProps {
  url: string;
  label: string;
}

export function PageLink({ url, label }: PageLinkProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:underline"
    >
      {label}
    </a>
  );
}
