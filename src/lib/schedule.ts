import type {
  Schedule,
  TodayStatus,
  Category,
  Leg,
  RosterData
} from "../types";

/** 등록된 달 목록(YYYY-MM)을 오름차순으로 */
export function monthKeys(data: RosterData): string[] {
  return (data.months || [])
    .map((m) => m.month)
    .filter(Boolean)
    .sort();
}

export function findMonth(
  data: RosterData,
  monthKey: string
): Schedule | undefined {
  return (data.months || []).find((m) => m.month === monthKey);
}

/** 오늘이 속한 달 키(YYYY-MM) */
export function currentMonthKey(today: string): string {
  return today.slice(0, 7);
}

/** monthKey 기준 이전/다음 달 키 */
export function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(monthKey: string): { year: string; mon: string } {
  const [y, m] = monthKey.split("-");
  return { year: y, mon: m };
}

/** 오늘 날짜를 Asia/Seoul 기준 YYYY-MM-DD 로 반환 */
export function kstToday(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

/** YYYY-MM-DD 를 KST 자정의 Date(근사) 로 — 카운트다운/Dday 계산용 */
export function dateAtKst(day: string, time = "00:00"): Date {
  // KST = UTC+9, 고정 오프셋. 일광절약 없음.
  return new Date(`${day}T${time}:00+09:00`);
}

export function inRange(day: string, start: string, end: string): boolean {
  return start <= day && day <= end;
}

/** §6 오늘 판정 로직 */
export function resolveToday(data: Schedule, today: string): TodayStatus {
  for (const e of data.education || []) {
    if (e.date === today) return { kind: "education", education: e };
  }
  for (const o of data.offDays || []) {
    if (o.date === today) return { kind: "off", off: o };
  }
  for (const t of data.trips || []) {
    for (const l of t.legs || []) {
      if (l.date === today) {
        return {
          kind: l.dir === "out" ? "flight-out" : "flight-in",
          trip: t,
          leg: l
        };
      }
    }
    if (t.start && t.end && inRange(today, t.start, t.end)) {
      // today 가 어느 leg에도 없으면 레이오버
      const onLeg = (t.legs || []).some((l) => l.date === today);
      if (!onLeg) return { kind: "layover", trip: t };
    }
  }
  return { kind: "none" };
}

/** 오늘 이후 가장 가까운 다음 이벤트(미리보기) */
export interface UpcomingItem {
  date: string;
  kind: "flight" | "layover" | "off" | "education";
  label: string;
  sub?: string;
}

export function nextUpcoming(
  data: Schedule,
  today: string,
  limit = 3
): UpcomingItem[] {
  const items: UpcomingItem[] = [];
  for (const t of data.trips || []) {
    for (const l of t.legs || []) {
      if (l.date > today) {
        items.push({
          date: l.date,
          kind: "flight",
          label: `${l.flight ?? "비행"} ${l.from}→${l.to}`,
          sub: `${l.dep ?? "--:--"} ${l.dir === "out" ? "출발" : "복귀"}`
        });
      }
    }
  }
  for (const o of data.offDays || []) {
    if (o.date > today)
      items.push({
        date: o.date,
        kind: "off",
        label: `휴무 (${o.code ?? "OFF"})`
      });
  }
  for (const e of data.education || []) {
    if (e.date > today)
      items.push({
        date: e.date,
        kind: "education",
        label: "교육",
        sub: `${e.from}–${e.to}`
      });
  }
  items.sort((a, b) => a.date.localeCompare(b.date));
  return items.slice(0, limit);
}

/** 리포팅 추정 = 출발 -90분 (HH:mm) */
export function reportingTime(dep: string | null): string | null {
  if (!dep) return null;
  const [h, m] = dep.split(":").map(Number);
  const total = h * 60 + m - 90;
  const norm = ((total % 1440) + 1440) % 1440;
  const hh = String(Math.floor(norm / 60)).padStart(2, "0");
  const mm = String(norm % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** 분 → "92h 25m" */
export function fmtDuration(min: number): string {
  if (!min) return "0h";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** D-day: 양수면 D-n, 0이면 D-DAY */
export function ddayLabel(target: string, today: string): string {
  const diff = Math.round(
    (dateAtKst(target).getTime() - dateAtKst(today).getTime()) / 86400000
  );
  if (diff === 0) return "D-DAY";
  if (diff > 0) return `D-${diff}`;
  return `D+${-diff}`;
}

export const CATEGORY_META: Record<
  Category,
  { label: string; accent: string; bg: string; ring: string }
> = {
  long: {
    label: "장거리",
    accent: "#5b8def",
    bg: "from-[#0a1f44] to-[#13294f]",
    ring: "ring-[#2f5fa6]"
  },
  mid: {
    label: "중거리",
    accent: "#2dd4bf",
    bg: "from-[#0c3a3a] to-[#10504e]",
    ring: "ring-[#2c7a7b]"
  },
  short: {
    label: "단거리",
    accent: "#56b3f0",
    bg: "from-[#123a5c] to-[#1a5680]",
    ring: "ring-[#2f86d4]"
  },
  domestic: {
    label: "국내",
    accent: "#94a3b8",
    bg: "from-[#1e293b] to-[#334155]",
    ring: "ring-slate-500"
  }
};

export interface MonthSummary {
  trips: number;
  flights: number;
  layoverNights: number;
  offDays: number;
  educationDays: number;
  blockMinutes: number; // 총 비행시간(분)
}

export function monthSummary(data: Schedule): MonthSummary {
  let flights = 0;
  let layoverNights = 0;
  let blockMinutes = 0;
  for (const t of data.trips || []) {
    flights += (t.legs || []).filter((l) => l.flight).length;
    if (t.layover) layoverNights += t.layover.nights;
    for (const l of t.legs || []) blockMinutes += l.block ?? 0;
  }
  return {
    trips: (data.trips || []).length,
    flights,
    layoverNights,
    offDays: (data.offDays || []).length,
    educationDays: (data.education || []).length,
    blockMinutes
  };
}

export type RhythmKind =
  | "flight"
  | "layover"
  | "off"
  | "education"
  | "empty";

export interface RhythmDay {
  date: string;
  day: number;
  kind: RhythmKind;
  category?: Category;
}

/** 해당 달의 1일~말일 리듬 스트립 */
export function monthRhythm(data: Schedule): RhythmDay[] {
  const [y, m] = data.month.split("-").map(Number);
  const days = new Date(y, m, 0).getDate();
  const out: RhythmDay[] = [];
  for (let d = 1; d <= days; d++) {
    const date = `${data.month}-${String(d).padStart(2, "0")}`;
    let kind: RhythmKind = "empty";
    let category: Category | undefined;
    if ((data.education || []).some((e) => e.date === date)) kind = "education";
    else if ((data.offDays || []).some((o) => o.date === date)) kind = "off";
    else {
      for (const t of data.trips || []) {
        const onLeg = (t.legs || []).some(
          (l: Leg) => l.date === date && l.flight
        );
        if (onLeg) {
          kind = "flight";
          category = t.category;
          break;
        }
        if (inRange(date, t.start, t.end)) {
          kind = "layover";
          category = t.category;
          break;
        }
      }
    }
    out.push({ date, day: d, kind, category });
  }
  return out;
}
