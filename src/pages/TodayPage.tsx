import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { RosterData } from "../types";
import {
  CATEGORY_META,
  currentMonthKey,
  dateAtKst,
  ddayLabel,
  findMonth,
  kstToday,
  nextUpcoming,
  reportingTime,
  resolveToday
} from "../lib/schedule";
import {
  ArrowIcon,
  CapIcon,
  HotelIcon,
  MoonIcon,
  PlaneIcon,
  SunIcon
} from "../components/icons";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function weekday(day: string): string {
  return WEEKDAYS[dateAtKst(day).getUTCDay()];
}

function useClock(target: Date | null) {
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
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    h: pad(Math.floor(diff / 3600)),
    m: pad(Math.floor((diff % 3600) / 60)),
    s: pad(diff % 60),
    past
  };
}

export default function TodayPage({ data }: { data: RosterData }) {
  const today = kstToday();
  const monthKey = currentMonthKey(today);
  const sched = findMonth(data, monthKey);

  const status = sched
    ? resolveToday(sched, today)
    : { kind: "none" as const };
  const upcoming = sched ? nextUpcoming(sched, today) : [];

  const depDate =
    status.kind !== "none" && status.leg?.dep
      ? dateAtKst(status.leg.date, status.leg.dep)
      : null;
  const clock = useClock(depDate);

  const [, mm, dd] = today.split("-");

  return (
    <div className="space-y-7">
      <header className="rise rise-1 flex items-end justify-between">
        <div>
          <p className="eyebrow">오늘 · {weekday(today)}요일</p>
          <h1 className="mt-1 font-display text-[2.7rem] font-extrabold leading-none tracking-tight tnum">
            {mm}<span className="text-[var(--faint)]">.</span>{dd}
          </h1>
        </div>
        <p className="eyebrow pb-1 tnum">{monthKey}</p>
      </header>

      {!sched ? (
        <EmptyToday monthKey={monthKey} />
      ) : (
        <>
          <div className="rise rise-2">
            <HeroCard status={status} today={today} clock={clock} />
          </div>

          <section className="rise rise-3">
            <p className="eyebrow mb-3 px-1">다음 일정</p>
            {upcoming.length === 0 ? (
              <p className="px-1 text-sm text-[var(--faint)]">
                예정된 일정이 없어요.
              </p>
            ) : (
              <ol className="relative space-y-2.5 pl-1">
                {upcoming.map((u, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex flex-col items-center self-stretch">
                      <span className="mt-3.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/70" />
                      {i < upcoming.length - 1 && (
                        <span className="w-px flex-1 bg-white/10" />
                      )}
                    </div>
                    <div className="glass mb-0.5 flex flex-1 items-center justify-between rounded-2xl px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold tracking-tight">
                          {u.label}
                        </p>
                        {u.sub && (
                          <p className="font-mono text-xs text-[var(--muted)]">
                            {u.sub}
                          </p>
                        )}
                      </div>
                      <div className="pl-3 text-right">
                        <p className="font-mono text-[11px] text-[var(--faint)] tnum">
                          {u.date.slice(5).replace("-", ".")}
                        </p>
                        <p className="text-xs font-bold text-sky-300 tnum">
                          {ddayLabel(u.date, today)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </div>
  );
}

/* ───────────────────────── 빈 상태 ───────────────────────── */
function EmptyToday({ monthKey }: { monthKey: string }) {
  return (
    <div className="rise rise-2 glass relative overflow-hidden rounded-[28px] px-7 py-12 text-center">
      <div
        className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-48 w-48 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle,#2f5fa6,transparent 70%)" }}
      />
      <div className="relative">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-[var(--muted)]">
          <PlaneIcon size={28} />
        </div>
        <h2 className="mt-5 font-display text-xl font-bold tracking-tight">
          아직 등록된 스케줄이 없어요
        </h2>
        <p className="mx-auto mt-2 max-w-[16rem] text-sm leading-relaxed text-[var(--muted)]">
          {monthKey.replace("-", ".")} 스케줄 사진을 올려 데이터를 만들면
          오늘 일정이 여기에 나타나요.
        </p>
        <Link
          to="/help"
          className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.09]"
        >
          스케줄 등록하는 법
          <ArrowIcon size={16} />
        </Link>
      </div>
    </div>
  );
}

/* ───────────────────────── 히어로 카드 ───────────────────────── */
function HeroCard({
  status,
  today,
  clock
}: {
  status: ReturnType<typeof resolveToday>;
  today: string;
  clock: ReturnType<typeof useClock>;
}) {
  if (status.kind === "flight-out" || status.kind === "flight-in") {
    return <FlightHero status={status} today={today} clock={clock} />;
  }
  if (status.kind === "layover") {
    const trip = status.trip!;
    const meta = CATEGORY_META[trip.category];
    return (
      <StateHero accent={meta.accent} icon={<HotelIcon size={26} />} eyebrow="레이오버">
        <h2 className="font-display text-3xl font-extrabold tracking-tight">
          {trip.layover?.city ?? trip.destination.city}
        </h2>
        <p className="mt-1.5 font-mono text-sm text-[var(--muted)]">
          {trip.destination.code} · {trip.destination.country}
          {trip.layover && ` · ${trip.layover.nights}박`}
        </p>
      </StateHero>
    );
  }
  if (status.kind === "off") {
    return (
      <StateHero accent="#6ee7a8" icon={<MoonIcon size={26} />} eyebrow="휴무">
        <h2 className="font-display text-3xl font-extrabold tracking-tight">
          오프
        </h2>
        <p className="mt-1.5 font-mono text-sm text-[var(--muted)]">
          {status.off?.code ?? "OFF"}
        </p>
      </StateHero>
    );
  }
  if (status.kind === "education") {
    return (
      <StateHero accent="#f0c46a" icon={<CapIcon size={26} />} eyebrow="교육">
        <h2 className="font-display text-3xl font-extrabold tracking-tight">
          교육
        </h2>
        <p className="mt-1.5 font-mono text-sm text-[var(--muted)]">
          {status.education?.from}–{status.education?.to}
          {status.education?.place ? ` · ${status.education.place}` : ""}
        </p>
      </StateHero>
    );
  }
  return (
    <StateHero accent="#9fb0cc" icon={<SunIcon size={26} />} eyebrow="일정 없음">
      <h2 className="font-display text-3xl font-extrabold tracking-tight">
        여유로운 하루
      </h2>
      <p className="mt-1.5 text-sm text-[var(--muted)]">예정된 비행이 없어요.</p>
    </StateHero>
  );
}

function StateHero({
  accent,
  icon,
  eyebrow,
  children
}: {
  accent: string;
  icon: ReactNode;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <div className="glass relative overflow-hidden rounded-[28px] p-7">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-30 blur-3xl"
        style={{ background: `radial-gradient(circle,${accent},transparent 70%)` }}
      />
      <div className="relative flex items-start gap-4">
        <div
          className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border"
          style={{
            borderColor: `${accent}40`,
            color: accent,
            background: `${accent}14`
          }}
        >
          {icon}
        </div>
        <div className="pt-1">
          <p className="eyebrow" style={{ color: accent }}>
            {eyebrow}
          </p>
          <div className="mt-1.5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function FlightHero({
  status,
  today,
  clock
}: {
  status: ReturnType<typeof resolveToday>;
  today: string;
  clock: ReturnType<typeof useClock>;
}) {
  const trip = status.trip!;
  const leg = status.leg!;
  const meta = CATEGORY_META[trip.category];
  const reporting = reportingTime(leg.dep);
  const dirLabel = leg.dir === "out" ? "출발" : "복귀";
  const plus1 = leg.arrDate && leg.arrDate !== leg.date;

  return (
    <div className="glass relative overflow-hidden rounded-[28px]">
      <div
        className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full opacity-30 blur-3xl"
        style={{
          background: `radial-gradient(circle,${meta.accent},transparent 70%)`
        }}
      />
      <div className="relative p-6">
        <div className="flex items-center justify-between">
          <span
            className="rounded-full px-3 py-1 text-[11px] font-bold tracking-wide"
            style={{ background: `${meta.accent}1f`, color: meta.accent }}
          >
            {meta.label} · {dirLabel}
          </span>
          <span className="font-mono text-sm font-bold text-sky-200 tnum">
            {ddayLabel(leg.date, today)}
          </span>
        </div>

        {/* 노선 */}
        <div className="mt-7 flex items-end justify-between">
          <div>
            <p className="font-display text-[2.6rem] font-extrabold leading-none tracking-tight">
              {leg.from}
            </p>
            <p className="mt-1.5 font-mono text-sm text-[var(--muted)] tnum">
              {leg.dep ?? "--:--"}
            </p>
          </div>

          <div className="flex flex-1 flex-col items-center px-3 pb-2">
            <div className="flex w-full items-center text-[var(--faint)]">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <PlaneIcon size={18} className="mx-1 rotate-90 text-sky-300" />
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
            </div>
            <p className="mt-2 font-mono text-[11px] tracking-wide text-[var(--muted)]">
              {leg.flight ?? "—"}
            </p>
          </div>

          <div className="text-right">
            <p className="font-display text-[2.6rem] font-extrabold leading-none tracking-tight">
              {leg.to}
            </p>
            <p className="mt-1.5 font-mono text-sm text-[var(--muted)] tnum">
              {leg.arr ?? "--:--"}
              {plus1 && (
                <sup className="ml-0.5 text-[10px] text-amber-300">+1</sup>
              )}
            </p>
          </div>
        </div>

        <p className="mt-4 flex items-center gap-2 text-sm text-[var(--muted)]">
          {trip.destination.city}
          {leg.redeye && (
            <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-200">
              레드아이
            </span>
          )}
        </p>
      </div>

      {/* 절취선 */}
      <div className="relative">
        <span className="absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
        <span className="absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
        <div className="mx-6 border-t border-dashed border-white/15" />
      </div>

      {/* 리포팅 / 카운트다운 */}
      <div className="relative grid grid-cols-2 gap-4 p-6">
        <div>
          <p className="eyebrow">리포팅 (추정)</p>
          <p className="mt-1 font-mono text-2xl font-bold tnum">
            {reporting ?? "--:--"}
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--faint)]">출발 -90분</p>
        </div>
        <div className="text-right">
          <p className="eyebrow">{clock?.past ? "출발 경과" : "출발까지"}</p>
          <p className="mt-1 font-mono text-2xl font-bold text-sky-200 tnum">
            {clock ? `${clock.h}:${clock.m}:${clock.s}` : "--:--:--"}
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--faint)]">현지 기준</p>
        </div>
      </div>
    </div>
  );
}
