export type Category = "long" | "mid" | "short" | "domestic";

export interface Leg {
  dir: "out" | "in";
  date: string; // YYYY-MM-DD (board cell)
  flight: string | null;
  from: string;
  to: string;
  dep: string | null; // local HH:mm
  arr: string | null; // local HH:mm
  arrDate: string; // YYYY-MM-DD
  redeye?: boolean;
  block?: number; // 비행시간(분) — 출도착 시차 반영한 실제 블록타임
}

export interface Layover {
  city: string;
  nights: number;
  from: string;
  to: string;
}

export interface Destination {
  code: string;
  city: string;
  country: string;
}

export interface Trip {
  id: string;
  category: Category;
  region?: string;
  destination: Destination;
  start: string;
  end: string;
  days: number;
  redeye?: boolean;
  legs: Leg[];
  layover?: Layover;
}

export interface OffDay {
  date: string;
  code?: string;
}

export interface Education {
  date: string;
  from: string;
  to: string;
  place?: string;
}

export interface Schedule {
  month: string; // YYYY-MM
  crew?: string;
  rev?: string;
  homeBase?: string;
  trips: Trip[];
  offDays: OffDay[];
  education: Education[];
}

/** 단일 소스: 여러 달을 담는다. 사진을 올릴 때마다 한 달씩 쌓인다. */
export interface RosterData {
  months: Schedule[];
}

export type TodayKind =
  | "flight-out"
  | "flight-in"
  | "layover"
  | "off"
  | "education"
  | "none";

export interface TodayStatus {
  kind: TodayKind;
  trip?: Trip;
  leg?: Leg;
  off?: OffDay;
  education?: Education;
}
