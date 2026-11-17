import * as React from "react";

export const LoginLoading = () => (
  <div className="login-loading" role="status" aria-live="polite">
    <svg
      className="login-loading__logo"
      viewBox="0 0 406 80"
      aria-hidden="true"
      focusable="false"
    >
      <g transform="translate(6 6)" fill="#ff7988">
        <g transform="translate(0 0)">
          <g className="login-loading__letter">
            <path d="M26 0H56Q64 0 64 8V29Q64 36 59 41L57 43Q52 48 45 48H19Q12 48 7 43L5 41Q0 36 0 29V25Q0 21 4 21H9Q13 21 13 25V27Q13 31 16 34Q18 36 23 36H41Q46 36 48 34Q51 31 51 27V12H26Q22 12 22 8V4Q22 0 26 0Z" />
          </g>
        </g>
        <g transform="translate(76 12)">
          <g className="login-loading__letter">
            <path d="M16 0H38C49 0 54 5 54 16V20C54 31 49 36 38 36H16C5 36 0 31 0 20V16C0 5 5 0 16 0Z M18 11C13 11 12 13 12 17V19C12 23 13 25 18 25H36C41 25 42 23 42 19V17C42 13 41 11 36 11Z" />
            <rect x="21" y="15" width="12" height="6" rx="1.8" />
          </g>
        </g>
        <g transform="translate(142 12)">
          <g className="login-loading__letter">
            <path d="M0 32V4Q0 0 4 0H8Q12 0 12 4V5Q18 0 27 0H34Q54 0 54 20V32Q54 36 50 36H46Q42 36 42 32V21Q42 11 32 11H25Q12 11 12 22V32Q12 36 8 36H4Q0 36 0 32Z" />
          </g>
        </g>
        <g transform="translate(208 12)">
          <g className="login-loading__letter">
            <path d="M16 0H38C49 0 54 5 54 16V20C54 31 49 36 38 36H16C5 36 0 31 0 20V16C0 5 5 0 16 0Z M18 11C13 11 12 13 12 17V19C12 23 13 25 18 25H36C41 25 42 23 42 19V17C42 13 41 11 36 11Z M42 18H54V35Q54 52 36 52H12Q8 52 8 48V45Q8 41 12 41H34Q42 41 42 34Z" />
          </g>
        </g>
        <g transform="translate(274 12)">
          <g className="login-loading__letter">
            <path d="M0 18V-8Q0 -12 4 -12H8Q12 -12 12 -8V11Z M16 0H38C49 0 54 5 54 16V20C54 31 49 36 38 36H16C5 36 0 31 0 20V16C0 5 5 0 16 0Z M18 11C13 11 12 13 12 17V19C12 23 13 25 18 25H36C41 25 42 23 42 19V17C42 13 41 11 36 11Z" />
          </g>
        </g>
        <g transform="translate(340 12)">
          <g className="login-loading__letter">
            <path d="M16 0H38C49 0 54 5 54 16V20C54 31 49 36 38 36H16C5 36 0 31 0 20V16C0 5 5 0 16 0Z M18 11C13 11 12 13 12 17V19C12 23 13 25 18 25H36C41 25 42 23 42 19V17C42 13 41 11 36 11Z" />
            <rect x="21" y="15" width="12" height="6" rx="1.8" />
          </g>
        </g>
      </g>
    </svg>
    <span className="sr-only">読み込み中…</span>
  </div>
);
