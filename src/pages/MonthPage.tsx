import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { RosterData, Schedule, Trip } from "../types";
import {
  CATEGORY_META,
  currentMonthKey,
  kstToday,
  monthKeys,
  monthRhythm,
  monthSummary,
  shiftMonth,
  type RhythmKind
} from "../lib/schedule";
import { ChevronLeft, ChevronRight, PlaneIcon } from "../components/icons";

const RHYTHM_COLORS: Record<RhythmKind, string> = {
  flight: "#5b8def",
  layover: "#2dd4bf",
  off: "#6ee7a8",
  education: "#f0c46a",
  empty: "rgba(255,255,255,0.06)"
};

export default function MonthPage({ data }: { data: RosterData }) {
  const today = kstToday();
  const curKey = currentMonthKey(today);
  const keys = useMemo(() => monthKeys(data), [data]);

  const initial = keys.includes(curKey)
    ? curKey
    : keys[keys.length - 1] ?? curKey;
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
  const sched = keys.includes(sel)
    ? data.months.find((m) => m.month === sel)
    : undefined;

  return (
    <div className="space-y-6">
      <Header
        sel={sel}
        curKey={curKey}
        canPrev={canPrev}
        canNext={canNext}
        onPrev={() => canPrev && setSel(keys[idx - 1])}
        onNext={() => canNext && setSel(keys[idx + 1])}
      />
      {sched ? (
        <MonthBody key={sched.month} sched={sched} />
      ) : (
        <EmptyMonth monthKey={sel} />
      )}
    </div>
  );
}

function relLabel(sel: string, curKey: string): string {
  if (sel === curKey) return "이번 달";
  if (sel === shiftMonth(curKey, -1)) return "지난달";
  if (sel === shiftMonth(curKey, 1)) return "다음 달";
  return "스케줄";
}

function Header({
  sel,
  curKey,
  canPrev,
  canNext,
  onPrev,
  onNext
}: {
  sel: string;
  curKey: string;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
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

function NavBtn({
  disabled,
  onClick,
  dir
}: {
  disabled: boolean;
  onClick: () => void;
  dir: "left" | "right";
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "left" ? "이전 달" : "다음 달"}
      className={`grid h-11 w-11 place-items-center rounded-full border border-white/10 transition ${
        disabled
          ? "opacity-25"
          : "bg-white/[0.04] text-white hover:bg-white/[0.08] active:scale-95"
      }`}
    >
      {dir === "left" ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
    </button>
  );
}

function MonthBody({ sched }: { sched: Schedule }) {
  const sum = monthSummary(sched);
  const rhythm = monthRhythm(sched);

  const stats = [
    { label: "트립", value: sum.trips },
    { label: "비행편", value: sum.flights },
    { label: "L/O박", value: sum.layoverNights },
    { label: "휴무", value: sum.offDays },
    { label: "교육", value: sum.educationDays }
  ];

  return (
    <>
      <section className="rise rise-1 grid grid-cols-5 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="glass rounded-2xl px-1 py-3 text-center"
          >
            <p className="font-display text-xl font-bold tnum">{s.value}</p>
            <p className="mt-0.5 text-[10px] text-[var(--faint)]">{s.label}</p>
          </div>
        ))}
      </section>

      <section className="rise rise-2">
        <p className="eyebrow mb-3 px-1">한 달의 리듬</p>
        <div className="glass rounded-2xl p-4">
          <div className="grid grid-cols-7 gap-1.5">
            {rhythm.map((d) => {
              const color =
                (d.kind === "flight" || d.kind === "layover") && d.category
                  ? CATEGORY_META[d.category].accent
                  : RHYTHM_COLORS[d.kind];
              return (
                <div
                  key={d.date}
                  title={`${d.day}일`}
                  className="flex aspect-square items-center justify-center rounded-lg text-[10px] font-semibold tnum"
                  style={{
                    background:
                      d.kind === "empty" ? color : `${color}26`,
                    color: d.kind === "empty" ? "var(--faint)" : color,
                    boxShadow:
                      d.kind === "empty"
                        ? "none"
                        : `inset 0 0 0 1px ${color}55`
                  }}
                >
                  {d.day}
                </div>
              );
            })}
          </div>
          <Legend />
        </div>
      </section>

      <section className="rise rise-3 space-y-3">
        <p className="eyebrow px-1">트립</p>
        {sched.trips.length === 0 ? (
          <p className="px-1 text-sm text-[var(--faint)]">
            등록된 트립이 없어요.
          </p>
        ) : (
          sched.trips.map((t) => <BoardingPass key={t.id} trip={t} />)
        )}
      </section>
    </>
  );
}

function Legend() {
  const items: { k: RhythmKind; t: string }[] = [
    { k: "flight", t: "비행" },
    { k: "layover", t: "레이오버" },
    { k: "off", t: "휴무" },
    { k: "education", t: "교육" }
  ];
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-white/8 pt-3">
      {items.map((i) => (
        <span
          key={i.k}
          className="flex items-center gap-1.5 text-[10px] text-[var(--muted)]"
        >
          <span
            className="h-2.5 w-2.5 rounded-[3px]"
            style={{ background: RHYTHM_COLORS[i.k] }}
          />
          {i.t}
        </span>
      ))}
    </div>
  );
}

function BoardingPass({ trip }: { trip: Trip }) {
  const meta = CATEGORY_META[trip.category];
  const out = trip.legs.find((l) => l.dir === "out");
  const back = trip.legs.find((l) => l.dir === "in");

  return (
    <div className="glass relative overflow-hidden rounded-3xl">
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full opacity-25 blur-3xl"
        style={{
          background: `radial-gradient(circle,${meta.accent},transparent 70%)`
        }}
      />
      <div className="relative flex items-center justify-between px-5 pt-4">
        <span
          className="rounded-full px-3 py-1 text-[11px] font-bold"
          style={{ background: `${meta.accent}1f`, color: meta.accent }}
        >
          {meta.label}
        </span>
        <span className="font-mono text-[11px] text-[var(--muted)] tnum">
          {trip.start.slice(5).replace("-", ".")}–
          {trip.end.slice(5).replace("-", ".")} · {trip.days}일
        </span>
      </div>

      <div className="relative flex items-end justify-between px-5 py-4">
        <p className="font-display text-3xl font-extrabold tracking-tight">
          {trip.legs[0]?.from ?? "—"}
        </p>
        <div className="flex flex-1 flex-col items-center px-3 pb-1.5 text-[var(--faint)]">
          <PlaneIcon size={16} className="rotate-90 text-sky-300" />
          <p className="mt-1 font-mono text-[11px] text-[var(--muted)]">
            {trip.destination.city}
          </p>
        </div>
        <p className="font-display text-3xl font-extrabold tracking-tight">
          {trip.destination.code}
        </p>
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
          {trip.layover && (
            <span>
              {trip.layover.city} {trip.layover.nights}박
            </span>
          )}
          {trip.redeye && (
            <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-200">
              레드아이
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function LegRow({
  label,
  leg
}: {
  label: string;
  leg: Trip["legs"][number] | undefined;
}) {
  if (!leg) return <div className="text-[var(--faint)]">{label} · —</div>;
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="mt-1 text-sm text-[var(--ink)]">{leg.flight ?? "—"}</p>
      <p className="mt-0.5 text-[var(--muted)]">
        {leg.from} {leg.dep ?? "--:--"} → {leg.to} {leg.arr ?? "--:--"}
        {leg.arrDate !== leg.date && (
          <sup className="ml-0.5 text-[9px] text-amber-300">+1</sup>
        )}
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
        스케줄 사진을 올려 데이터를 만들면 매달 쌓여 지난달·다음 달도 볼 수
        있어요.
      </p>
      <Link
        to="/help"
        className="mt-6 inline-flex items-center rounded-full border border-white/12 bg-white/[0.05] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.09]"
      >
        스케줄 등록하는 법
      </Link>
    </div>
  );
}
