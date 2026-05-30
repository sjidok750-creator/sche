import type { Schedule, Trip } from "../types";
import {
  CATEGORY_META,
  monthRhythm,
  monthSummary,
  type RhythmKind
} from "../lib/schedule";

const RHYTHM_COLORS: Record<RhythmKind, string> = {
  flight: "#2f86d4",
  layover: "#4aa3c4",
  off: "#5e9c6e",
  education: "#c98a1f",
  empty: "#1e293b"
};

export default function MonthPage({ data }: { data: Schedule }) {
  const sum = monthSummary(data);
  const rhythm = monthRhythm(data);

  return (
    <div className="space-y-5">
      <header>
        <p className="font-mono text-xs text-slate-400">
          {data.crew ? `${data.crew} · ` : ""}
          {data.rev ?? ""}
        </p>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {data.month} 스케줄
        </h1>
      </header>

      {/* 요약 */}
      <section className="grid grid-cols-5 gap-2">
        <Stat label="트립" value={sum.trips} />
        <Stat label="비행편" value={sum.flights} />
        <Stat label="L/O박" value={sum.layoverNights} />
        <Stat label="휴무" value={sum.offDays} />
        <Stat label="교육" value={sum.educationDays} />
      </section>

      {/* 30일 리듬 스트립 */}
      <section>
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          한 달 리듬
        </h2>
        <div className="flex flex-wrap gap-1">
          {rhythm.map((d) => (
            <div
              key={d.date}
              title={`${d.day}일 · ${d.kind}`}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-medium text-white/80"
              style={{
                background:
                  d.kind === "flight" || d.kind === "layover"
                    ? d.category
                      ? CATEGORY_META[d.category].accent
                      : RHYTHM_COLORS[d.kind]
                    : RHYTHM_COLORS[d.kind],
                opacity: d.kind === "empty" ? 0.5 : 1
              }}
            >
              {d.day}
            </div>
          ))}
        </div>
        <Legend />
      </section>

      {/* 보딩패스 카드 */}
      <section className="space-y-3">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          트립
        </h2>
        {data.trips.map((t) => (
          <BoardingPass key={t.id} trip={t} />
        ))}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/5 p-2 text-center">
      <p className="font-display text-xl font-bold">{value}</p>
      <p className="text-[10px] text-slate-400">{label}</p>
    </div>
  );
}

function Legend() {
  const items: { k: RhythmKind; t: string }[] = [
    { k: "flight", t: "비행" },
    { k: "layover", t: "L/O" },
    { k: "off", t: "휴무" },
    { k: "education", t: "교육" }
  ];
  return (
    <div className="mt-2 flex gap-3 px-1">
      {items.map((i) => (
        <span key={i.k} className="flex items-center gap-1 text-[10px] text-slate-400">
          <span
            className="h-2.5 w-2.5 rounded-sm"
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
    <div
      className={`overflow-hidden rounded-2xl bg-gradient-to-br ${meta.bg} ring-1 ${meta.ring}`}
    >
      <div className="flex items-center justify-between px-4 pt-3">
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
          style={{ background: `${meta.accent}22`, color: meta.accent }}
        >
          {meta.label}
        </span>
        <span className="font-mono text-xs text-slate-300">
          {trip.start.slice(5).replace("-", ".")}–
          {trip.end.slice(5).replace("-", ".")} · {trip.days}일
        </span>
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="font-display text-2xl font-extrabold">
              {trip.legs[0]?.from ?? "—"}
            </p>
          </div>
          <div className="flex-1 px-2 text-center">
            <p className="text-base">✈️</p>
            <p className="font-mono text-[11px] text-slate-300">
              {trip.destination.city}
            </p>
          </div>
          <div className="text-center">
            <p className="font-display text-2xl font-extrabold">
              {trip.destination.code}
            </p>
          </div>
        </div>
      </div>

      {/* perforation */}
      <div className="relative border-t border-dashed border-white/20">
        <span className="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-[#050f24]" />
        <span className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-[#050f24]" />
      </div>

      <div className="grid grid-cols-2 gap-2 px-4 py-3 font-mono text-xs">
        <LegRow label="OUT" leg={out} />
        <LegRow label="IN" leg={back} />
      </div>

      {trip.layover && (
        <div className="border-t border-white/10 px-4 py-2 text-[11px] text-slate-300">
          🏨 {trip.layover.city} {trip.layover.nights}박
          {trip.redeye && (
            <span className="ml-2 rounded bg-indigo-500/30 px-1.5 py-0.5 text-[10px] text-indigo-200">
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
  if (!leg)
    return (
      <div className="text-slate-500">
        {label}: —
      </div>
    );
  return (
    <div>
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className="text-slate-100">{leg.flight ?? "—"}</p>
      <p className="text-slate-300">
        {leg.from} {leg.dep ?? "--:--"} → {leg.to} {leg.arr ?? "--:--"}
        {leg.arrDate !== leg.date && (
          <span className="ml-0.5 align-super text-[9px] text-amber-300">+1</span>
        )}
      </p>
    </div>
  );
}
