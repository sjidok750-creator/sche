import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { RosterData, Schedule, Trip } from "../types";
import {
  categoryMeta,
  currentMonthKey,
  fmtDuration,
  kstToday,
  monthKeys,
  monthRhythm,
  monthStartDow,
  monthSummary,
  offCodeForDate,
  shiftMonth,
  type RhythmKind
} from "../lib/schedule";
import { ChevronLeft, ChevronRight, PlaneIcon } from "../components/icons";

const WEEK_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

/* 달력 셀 색상 */
const KIND_COLOR: Record<RhythmKind, string> = {
  flight: "#5b8def",
  layover: "#2dd4bf",
  off: "#4ade80",        // 밝은 녹색 — 더 눈에 띄게
  education: "#f0c46a",
  standby: "#334155",   // 대기: 슬레이트
  empty: "transparent"
};

export default function MonthPage({ data }: { data: RosterData }) {
  const today = kstToday();
  const curKey = currentMonthKey(today);
  const keys = useMemo(() => monthKeys(data), [data]);

  const initial = keys.includes(curKey) ? curKey : keys[keys.length - 1] ?? curKey;
  const [sel, setSel] = useState(initial);

  if (keys.length === 0) {
    return (
      <div className="space-y-7">
        <Header sel={sel} curKey={curKey} canPrev={false} canNext={false} onPrev={() => {}} onNext={() => {}} />
        <EmptyMonth />
      </div>
    );
  }

  const idx = keys.indexOf(sel);
  const canPrev = idx > 0;
  const canNext = idx >= 0 && idx < keys.length - 1;
  const sched = data.months.find((m) => m.month === sel);

  return (
    <div className="space-y-5">
      <Header
        sel={sel}
        curKey={curKey}
        canPrev={canPrev}
        canNext={canNext}
        onPrev={() => canPrev && setSel(keys[idx - 1])}
        onNext={() => canNext && setSel(keys[idx + 1])}
      />
      {sched ? <MonthBody key={sched.month} sched={sched} today={today} /> : <EmptyMonth monthKey={sel} />}
    </div>
  );
}

function relLabel(sel: string, curKey: string): string {
  if (sel === curKey) return "이번 달";
  if (sel === shiftMonth(curKey, -1)) return "지난달";
  if (sel === shiftMonth(curKey, 1)) return "다음 달";
  return "스케줄";
}

function Header({ sel, curKey, canPrev, canNext, onPrev, onNext }: {
  sel: string; curKey: string; canPrev: boolean; canNext: boolean;
  onPrev: () => void; onNext: () => void;
}) {
  const [y, m] = sel.split("-");
  return (
    <header className="rise rise-1 flex items-center justify-between">
      <NavBtn disabled={!canPrev} onClick={onPrev} dir="left" />
      <div className="text-center">
        <p className="eyebrow">{relLabel(sel, curKey)}</p>
        <h1 className="mt-0.5 font-display text-3xl font-extrabold tracking-tight tnum">
          {y}<span className="text-[var(--faint)]">.</span>{m}
        </h1>
      </div>
      <NavBtn disabled={!canNext} onClick={onNext} dir="right" />
    </header>
  );
}

function NavBtn({ disabled, onClick, dir }: { disabled: boolean; onClick: () => void; dir: "left" | "right" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "left" ? "이전 달" : "다음 달"}
      className={`grid h-11 w-11 place-items-center rounded-full border border-white/10 transition ${
        disabled ? "opacity-20" : "bg-white/[0.04] text-white hover:bg-white/[0.08] active:scale-95"
      }`}
    >
      {dir === "left" ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
    </button>
  );
}

function MonthBody({ sched, today }: { sched: Schedule; today: string }) {
  const sum = monthSummary(sched);
  const rhythm = monthRhythm(sched);
  const dow = monthStartDow(sched.month);

  return (
    <>
      {/* 총 비행시간 히어로 */}
      <section className="rise rise-1 glass relative overflow-hidden rounded-3xl p-5">
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle,#5b8def,transparent 70%)" }}
        />
        <div className="relative flex items-end justify-between">
          <div>
            <p className="eyebrow">총 비행시간</p>
            <p className="mt-1.5 font-display text-4xl font-extrabold leading-none tnum">
              {fmtDuration(sum.blockMinutes)}
            </p>
          </div>
          <div className="flex items-center gap-2 pb-1.5 text-sky-300">
            <PlaneIcon size={18} className="rotate-90" />
            <span className="font-mono text-sm tnum">{sum.flights} legs</span>
          </div>
        </div>
      </section>

      {/* 요약 */}
      <section className="rise rise-1 grid grid-cols-4 gap-2">
        {[
          { label: "트립", v: sum.trips },
          { label: "L/O박", v: sum.layoverNights },
          { label: "휴무", v: sum.offDays },
          { label: "교육", v: sum.educationDays }
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl px-1 py-3 text-center">
            <p className="font-display text-xl font-bold tnum">{s.v}</p>
            <p className="mt-0.5 text-[10px] text-[var(--faint)]">{s.label}</p>
          </div>
        ))}
      </section>

      {/* ── 달력형 리듬 ── */}
      <section className="rise rise-2">
        <p className="eyebrow mb-2.5 px-1">한 달의 리듬</p>
        <div className="glass rounded-2xl p-3 pt-2.5">
          {/* 요일 헤더 */}
          <div className="mb-1.5 grid grid-cols-7 gap-1">
            {WEEK_LABELS.map((d, i) => (
              <p
                key={d}
                className="text-center text-[10px] font-semibold"
                style={{ color: i === 0 ? "#f87171" : i === 6 ? "#93c5fd" : "var(--faint)" }}
              >
                {d}
              </p>
            ))}
          </div>

          {/* 날짜 셀 */}
          <div className="grid grid-cols-7 gap-1">
            {/* 시작 오프셋 */}
            {Array.from({ length: dow }).map((_, i) => <div key={`o${i}`} />)}

            {rhythm.map((d) => {
              const isToday = d.date === today;
              const isOff = d.kind === "off";
              const isSunday = (dow + d.day - 1) % 7 === 0;
              const isSaturday = (dow + d.day - 1) % 7 === 6;
              const accent =
                (d.kind === "flight" || d.kind === "layover") && d.category
                  ? categoryMeta(d.category).accent
                  : KIND_COLOR[d.kind];
              const offCode = isOff ? offCodeForDate(sched, d.date) : undefined;

              return (
                <div
                  key={d.date}
                  title={`${d.day}일${offCode ? ` · ${offCode}` : ""}`}
                  className={`relative flex flex-col items-center justify-center rounded-xl transition ${
                    isOff ? "aspect-auto py-1.5" : "aspect-square"
                  } ${isToday ? "ring-2 ring-white/60 ring-offset-1 ring-offset-transparent" : ""}`}
                  style={{
                    background: d.kind === "empty" ? "transparent" : `${accent}20`,
                    boxShadow: d.kind !== "empty" && d.kind !== "standby"
                      ? `inset 0 0 0 1px ${accent}50`
                      : isOff ? undefined : "inset 0 0 0 1px rgba(255,255,255,0.06)"
                  }}
                >
                  <span
                    className="text-[11px] font-semibold tnum leading-none"
                    style={{
                      color: isOff
                        ? "#4ade80"
                        : isSunday
                        ? "#f87171"
                        : isSaturday
                        ? "#93c5fd"
                        : d.kind === "standby"
                        ? "var(--faint)"
                        : accent
                    }}
                  >
                    {d.day}
                  </span>
                  {isOff && offCode && (
                    <span
                      className="mt-0.5 text-[8px] font-bold leading-none tracking-wide"
                      style={{ color: "#4ade80" }}
                    >
                      {offCode.replace("ATDO","ATD").replace("ADO","ADO")}
                    </span>
                  )}
                  {d.kind === "standby" && (
                    <span className="mt-0.5 h-1 w-1 rounded-full bg-white/20" />
                  )}
                </div>
              );
            })}
          </div>

          {/* 범례 */}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-white/8 pt-3">
            {([
              ["flight", "비행"],
              ["layover", "레이오버"],
              ["off", "휴무"],
              ["education", "교육"],
              ["standby", "대기"]
            ] as [RhythmKind, string][]).map(([k, t]) => (
              <span key={k} className="flex items-center gap-1.5 text-[10px] text-[var(--muted)]">
                <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: KIND_COLOR[k] }} />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 트립 보딩패스 */}
      <section className="rise rise-3 space-y-3">
        <p className="eyebrow px-1">트립</p>
        {sched.trips.length === 0 ? (
          <p className="px-1 text-sm text-[var(--faint)]">등록된 트립이 없어요.</p>
        ) : (
          sched.trips.map((t) => <BoardingPass key={t.id} trip={t} />)
        )}
      </section>
    </>
  );
}

function BoardingPass({ trip }: { trip: Trip }) {
  const meta = categoryMeta(trip.category);
  const out = (trip.legs || []).find((l) => l.dir === "out");
  const back = (trip.legs || []).find((l) => l.dir === "in");

  return (
    <div className="glass relative overflow-hidden rounded-3xl">
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full opacity-25 blur-3xl"
        style={{ background: `radial-gradient(circle,${meta.accent},transparent 70%)` }}
      />
      <div className="relative flex items-center justify-between px-5 pt-4">
        <span
          className="rounded-full px-3 py-1 text-[11px] font-bold"
          style={{ background: `${meta.accent}1f`, color: meta.accent }}
        >
          {meta.label}
        </span>
        <span className="font-mono text-[11px] text-[var(--muted)] tnum">
          {trip.start ? trip.start.slice(5).replace("-", ".") : "—"}–{trip.end ? trip.end.slice(5).replace("-", ".") : "—"}{trip.days ? ` · ${trip.days}일` : ""}
        </span>
      </div>
      <div className="relative flex items-end justify-between px-5 py-4">
        <p className="font-display text-3xl font-extrabold tracking-tight">{(trip.legs || [])[0]?.from ?? "—"}</p>
        <div className="flex flex-1 flex-col items-center px-3 pb-1.5 text-[var(--faint)]">
          <PlaneIcon size={16} className="rotate-90 text-sky-300" />
          <p className="mt-1 font-mono text-[11px] text-[var(--muted)]">{trip.destination?.city ?? ""}</p>
        </div>
        <p className="font-display text-3xl font-extrabold tracking-tight">{trip.destination?.code ?? "—"}</p>
      </div>
      <div className="relative">
        <span className="absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
        <span className="absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
        <div className="mx-5 border-t border-dashed border-white/15" />
      </div>
      <div className="relative grid grid-cols-2 gap-3 px-5 py-4 font-mono text-xs">
        <LegRow label="OUT" leg={out} />
        <LegRow label="IN" leg={back} />
      </div>
      {(trip.layover || trip.redeye) && (
        <div className="relative flex items-center gap-2 border-t border-white/8 px-5 py-2.5 text-[11px] text-[var(--muted)]">
          {trip.layover && <span>{trip.layover.city} {trip.layover.nights}박</span>}
          {trip.redeye && (
            <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-200">레드아이</span>
          )}
        </div>
      )}
    </div>
  );
}

function LegRow({ label, leg }: { label: string; leg: Trip["legs"][number] | undefined }) {
  if (!leg) return <div className="text-[var(--faint)]">{label} · —</div>;
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="mt-1 text-sm text-[var(--ink)]">{leg.flight ?? "—"}</p>
      <p className="mt-0.5 text-[var(--muted)]">
        {leg.from} {leg.dep ?? "--:--"} → {leg.to} {leg.arr ?? "--:--"}
        {leg.arrDate !== leg.date && <sup className="ml-0.5 text-[9px] text-amber-300">+1</sup>}
      </p>
    </div>
  );
}

function EmptyMonth({ monthKey }: { monthKey?: string }) {
  return (
    <div className="rise rise-2 glass rounded-[28px] px-7 py-12 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-[var(--muted)]">
        <PlaneIcon size={28} />
      </div>
      <h2 className="mt-5 font-display text-xl font-bold tracking-tight">
        {monthKey ? `${monthKey.replace("-", ".")} 스케줄 없음` : "등록된 스케줄이 없어요"}
      </h2>
      <p className="mx-auto mt-2 max-w-[17rem] text-sm leading-relaxed text-[var(--muted)]">
        스케줄 사진을 올리면 달마다 쌓여 지난달·다음 달도 볼 수 있어요.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center rounded-full border border-white/12 bg-white/[0.05] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.09]"
      >
        사진 올리러 가기
      </Link>
    </div>
  );
}
