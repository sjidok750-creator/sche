// 가는 선 아이콘 세트 — 이모지 대신 일관된 톤을 위해 직접 그린다.
type P = { className?: string; size?: number };

const base = (size = 24) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const
});

export const PlaneIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M10.5 13.5 3 12l-.5-2 8 1.5L14 5c.4-.9 1-1.4 1.7-1.4.8 0 1.3.6 1.3 1.6l-.6 6.8 4 1.2-.4 1.6-3.8-.7-1 5.3 2 1.3-.2 1.3-3.2-1-3.2 1-.2-1.3 2-1.3-1-5.3Z" />
  </svg>
);

export const MoonIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M20 13.5A8 8 0 0 1 9.3 4 7 7 0 1 0 20 13.5Z" />
  </svg>
);

export const CapIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3 9.5 12 5l9 4.5-9 4.5-9-4.5Z" />
    <path d="M7 11.3v3.4c0 1 2.2 2.3 5 2.3s5-1.3 5-2.3v-3.4" />
    <path d="M21 9.5v4" />
  </svg>
);

export const HotelIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M5 20V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v15" />
    <path d="M15 11h3a1 1 0 0 1 1 1v8" />
    <path d="M3 20h18" />
    <path d="M8 8h2M8 12h2" />
  </svg>
);

export const SunIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="3.6" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
  </svg>
);

export const ArrowIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const ChevronLeft = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

export const ChevronRight = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const CalendarIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
    <path d="M3.5 9.5h17M8 3v3M16 3v3" />
  </svg>
);

export const TodayDot = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
  </svg>
);

export const HelpIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.6 9.5a2.4 2.4 0 1 1 3.4 2.2c-.8.4-1 .8-1 1.6" />
    <circle cx="12" cy="16.4" r="0.6" fill="currentColor" stroke="none" />
  </svg>
);
