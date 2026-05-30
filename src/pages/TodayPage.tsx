import { useEffect, useState } from "react";
import type { Schedule } from "../types";
import {
  CATEGORY_META,
  ddayLabel,
  dateAtKst,
  kstToday,
  nextUpcoming,
  reportingTime,
  resolveToday
} from "../lib/schedule";

function useCountdown(target: Date | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!target) return null;
  let diff = Math.floor((target.getTime() - now) / 1000);
  const past = diff < 0;
  diff = Math.abs(diff);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return { text: `${pad(h)}:${pad(m)}:${pad(s)}`, past };
}

export default function TodayPage({ data }: { data: Schedule }) {
  const today = kstToday();
  const status = resolveToday(data, today);
  const upcoming = nextUpcoming(data, today);

  const depDate =
    status.leg && status.leg.dep
      ? dateAtKst(status.leg.date, status.leg.dep)
      : null;
  const countdown = useCountdown(depDate);

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between">
        <div>
          <p className="font-mono text-xs text-slate-400">
            {data.crew ? `${data.crew} · ` : ""}
            {data.rev ?? ""}
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            오늘 {today.slice(5).replace("-", ".")}
          </h1>
        </div>
        <span className="font-mono text-xs text-slate-500">{data.month}</span>
      </header>

      {/* 큰 상태 카드 */}
      {status.kind === "flight-out" || status.kind === "flight-in" ? (
        <FlightCard
          schedule={data}
          status={status}
          today={today}
          countdown={countdown}
        />
      ) : status.kind === "layover" ? (
        <LayoverCard status={status} />
      ) : status.kind === "off" ? (
        <SimpleCard
          accent="#5e9c6e"
          icon="🌿"
          title="휴무"
          sub={status.off?.code ?? "OFF"}
        />
      ) : status.kind === "education" ? (
        <SimpleCard
          accent="#c98a1f"
          icon="🎓"
          title="교육"
          sub={`${status.education?.from}–${status.education?.to}${
            status.education?.place ? ` · ${status.education.place}` : ""
          }`}
        />
      ) : (
        <SimpleCard
          accent="#6a7d96"
          icon="🟦"
          title="오늘 일정 없음"
          sub="푹 쉬어요"
        />
      )}

      {/* 다음 일정 미리보기 */}
      <section>
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          다음 일정
        </h2>
        {upcoming.length === 0 ? (
          <p className="px-1 text-sm text-slate-500">예정된 일정이 없어요.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((u, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{u.label}</p>
                  {u.sub && (
                    <p className="font-mono text-xs text-slate-400">{u.sub}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs text-slate-400">
                    {u.date.slice(5).replace("-", ".")}
                  </p>
                  <p className="text-xs font-semibold text-sky-300">
                    {ddayLabel(u.date, today)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function FlightCard({
  status,
  today,
  countdown
}: {
  schedule: Schedule;
  status: ReturnType<typeof resolveToday>;
  today: string;
  countdown: { text: string; past: boolean } | null;
}) {
  const trip = status.trip!;
  const leg = status.leg!;
  const meta = CATEGORY_META[trip.category];
  const reporting = reportingTime(leg.dep);
  const dirLabel = leg.dir === "out" ? "출발" : "복귀";

  return (
    <div
      className={`rounded-3xl bg-gradient-to-br ${meta.bg} p-5 shadow-xl ring-1 ${meta.ring}`}
    >
      <div className="flex items-center justify-between">
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
          style={{ background: `${meta.accent}22`, color: meta.accent }}
        >
          {meta.label} · {dirLabel}
        </span>
        <span className="font-mono text-sm font-semibold text-sky-200">
          {ddayLabel(leg.date, today)}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-center">
          <p className="font-display text-3xl font-extrabold">{leg.from}</p>
          <p className="font-mono text-sm text-slate-200">{leg.dep ?? "--:--"}</p>
        </div>
        <div className="flex-1 px-3">
          <div className="relative flex items-center">
            <span className="h-2 w-2 rounded-full bg-white/70" />
            <span className="h-px flex-1 bg-white/30" />
            <span className="text-lg">✈️</span>
            <span className="h-px flex-1 bg-white/30" />
            <span className="h-2 w-2 rounded-full bg-white/70" />
          </div>
          <p className="mt-1 text-center font-mono text-xs text-slate-300">
            {leg.flight ?? "—"}
          </p>
        </div>
        <div className="text-center">
          <p className="font-display text-3xl font-extrabold">{leg.to}</p>
          <p className="font-mono text-sm text-slate-200">
            {leg.arr ?? "--:--"}
            {leg.arrDate && leg.arrDate !== leg.date && (
              <span className="ml-1 align-super text-[10px] text-amber-300">
                +1
              </span>
            )}
          </p>
        </div>
      </div>

      <p className="mt-3 text-center text-sm text-slate-200">
        {trip.destination.city}
        {leg.redeye && (
          <span className="ml-2 rounded bg-indigo-500/30 px-1.5 py-0.5 text-[10px] text-indigo-200">
            레드아이
          </span>
        )}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/15 pt-4">
        <div>
          <p className="text-[11px] text-slate-300">리포팅 (추정)</p>
          <p className="font-mono text-lg font-semibold">
            {reporting ?? "--:--"}
          </p>
          <p className="text-[10px] text-slate-400">출발 -90분</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-slate-300">
            {countdown?.past ? "출발 경과" : "출발까지"}
          </p>
          <p className="font-mono text-lg font-semibold text-sky-200">
            {countdown ? countdown.text : "--:--:--"}
          </p>
        </div>
      </div>
    </div>
  );
}

function LayoverCard({
  status
}: {
  status: ReturnType<typeof resolveToday>;
}) {
  const trip = status.trip!;
  const meta = CATEGORY_META[trip.category];
  const city = trip.layover?.city ?? trip.destination.city;
  return (
    <div
      className={`rounded-3xl bg-gradient-to-br ${meta.bg} p-6 shadow-xl ring-1 ${meta.ring}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">🏨</span>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-slate-300">
            레이오버
          </p>
          <h2 className="font-display text-2xl font-bold">{city}</h2>
        </div>
      </div>
      <p className="mt-3 font-mono text-sm text-slate-300">
        {trip.destination.code} · {trip.destination.country}
        {trip.layover && ` · ${trip.layover.nights}박`}
      </p>
    </div>
  );
}

function SimpleCard({
  accent,
  icon,
  title,
  sub
}: {
  accent: string;
  icon: string;
  title: string;
  sub: string;
}) {
  return (
    <div
      className="rounded-3xl bg-gradient-to-br from-[#0c1830] to-[#13233f] p-6 shadow-xl ring-1"
      style={{ borderColor: accent }}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <h2 className="font-display text-2xl font-bold">{title}</h2>
          <p className="font-mono text-sm" style={{ color: accent }}>
            {sub}
          </p>
        </div>
      </div>
    </div>
  );
}
