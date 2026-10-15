import React from 'react';
import { Link } from 'react-router-dom';
import logoMark from '../assets/billmd-mark.png';
import logoTextLight from '../assets/billmd-text.png';
import logoTextDark from '../assets/billmd-text-darkmode.png';

/**
 * Professional BrandLogo component for BillMD
 * Features the signature ribbon medical cross & document checkmark mark
 * alongside the official BillMD wordmark.
 *
 * Clean, borderless, and minimal — without artificial containers or taglines.
 */
export default function BrandLogo({
  size = 'md',
  showName = true,
  darkVariant = 'auto', // 'auto' | 'always' | 'never'
  to = null,
  className = '',
  imgClassName = '',
}) {
  const SIZES = {
    xs: {
      mark: 'w-5 h-5',
      text: 'h-4 w-auto',
      gap: 'gap-1.5',
    },
    sm: {
      mark: 'w-6 h-6',
      text: 'h-4.5 w-auto',
      gap: 'gap-2',
    },
    md: {
      mark: 'w-8 h-8',
      text: 'h-6 w-auto',
      gap: 'gap-2.5',
    },
    lg: {
      mark: 'w-10 h-10',
      text: 'h-7.5 w-auto',
      gap: 'gap-3',
    },
    xl: {
      mark: 'w-12 h-12',
      text: 'h-9 w-auto',
      gap: 'gap-3.5',
    },
  };

  const currentSize = SIZES[size] || SIZES.md;

  const renderWordmark = () => {
    if (!showName) return null;

    if (darkVariant === 'always') {
      return (
        <img
          src={logoTextDark}
          alt="BillMD"
          className={`object-contain select-none pointer-events-none ${currentSize.text} ${imgClassName}`}
          loading="eager"
        />
      );
    }

    if (darkVariant === 'never') {
      return (
        <img
          src={logoTextLight}
          alt="BillMD"
          className={`object-contain select-none pointer-events-none ${currentSize.text} ${imgClassName}`}
          loading="eager"
        />
      );
    }

    // 'auto' mode: light wordmark in light theme, white/teal wordmark in dark theme
    return (
      <div className="flex items-center">
        <img
          src={logoTextLight}
          alt="BillMD"
          className={`dark:hidden object-contain select-none pointer-events-none ${currentSize.text} ${imgClassName}`}
          loading="eager"
        />
        <img
          src={logoTextDark}
          alt="BillMD"
          className={`hidden dark:block object-contain select-none pointer-events-none ${currentSize.text} ${imgClassName}`}
          loading="eager"
        />
      </div>
    );
  };

  const content = (
    <div
      className={`group inline-flex items-center ${currentSize.gap} select-none transition-transform duration-150 hover:scale-[1.015] active:scale-[0.99] ${className}`}
    >
      {/* Brand Logo Mark — pure and borderless */}
      <img
        src={logoMark}
        alt="BillMD Logo"
        className={`object-contain select-none pointer-events-none shrink-0 ${currentSize.mark}`}
        loading="eager"
      />

      {/* BillMD Wordmark */}
      {renderWordmark()}
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="inline-flex items-center focus:outline-hidden focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg"
        aria-label="BillMD Home"
      >
        {content}
      </Link>
    );
  }

  return content;
}
