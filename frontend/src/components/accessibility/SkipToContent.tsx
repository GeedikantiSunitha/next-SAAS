import React from 'react';

interface SkipToContentProps {
  targetId: string;
  text?: string;
}

export const SkipToContent: React.FC<SkipToContentProps> = ({
  targetId,
  text = 'Skip to main content'
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      if (typeof target.scrollIntoView === 'function') {
        target.scrollIntoView();
      }
    }
  };

  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      onClick={handleClick}
    >
      {text}
    </a>
  );
};