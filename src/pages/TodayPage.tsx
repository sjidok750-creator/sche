import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { RosterData } from "../types";
import {
  CATEGORY_META,
  currentMonthKey,
  dateAtKst,
  ddayLabel,
  fmtDuration,
  findMonth,
  kstToday,
  monthSummary,
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
function weekday(day: string) {
  return WEEKDAYS[new Date(`${day}T12:00:00Z`).getUTCDay()];
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
  return { h: pad(Math.floor(diff / 3600)), m: pad(Math.floor((diff % 3600) / 60)), s: pad(diff % 60), past };
}

const ANALYSIS_PROMPT = `이 승무원 월간 스케줄 캘린더를 schedule.json 의 months 배열에 들어갈 JSON 한 객체로만 변환해줘. JSON만 출력(코드펜스·설명 없이).
규칙:
- 비행 블록이 놓인 날짜 칸 기준으로 date/arrDate 채움. 다음 칸 넘어가면 arrDate=+1일.
- 빈 칸(아무 표시 없음)=대기(standby).
- 국내선=domestic, EDU=education, ADO/ATDO/PDO/휴무=offDays.
- 국제선 거리: long(미주·유럽·대양주)/mid(동남아·중동)/short(일본·중국·괌).
- 출발 21:00 이후면 redeye=true. 편명 KExxxx 유지, 불명확하면 null.
- leg마다 block(비행시간, 분) 포함. 총 비행시간도 자동 계산됨.`;

export default function TodayPage({ data }: { data: RosterData }) {
  const today = kstToday();
  const monthKey = currentMonthKey(today);
  const sched = findMonth(data, monthKey);

  const [, mm, dd] = today.split("-");

  return (
    <div className="space-y-6">
      <header className="rise rise-1 flex items-end justify-between">
        <div>
          <p className="eyebrow">오늘 · {weekday(today)}요일</p>
          <h1 className="mt-1 font-display text-[2.7rem] font-extrabold leading-none tracking-tight tnum">
            {mm}<span className="text-[var(--faint)]">.</span>{dd}
          </h1>
        </div>
        <p className="eyebrow pb-1 tnum">{monthKey}</p>
      </header>

      {sched ? (
        <ScheduleView sched={sched} today={today} monthKey={monthKey} />
      ) : (
        <UploadView monthKey={monthKey} />
      )}
    </div>
  );
}

/* ─────────────── 스케줄 있을 때: 오늘 카드 + 요약 + 다음 일정 ─────────────── */
function ScheduleView({
  sched,
  today,
  monthKey
}: {
  data?: RosterData;
  sched: NonNullable<ReturnType<typeof findMonth>>;
  today: string;
  monthKey: string;
}) {
  const status = resolveToday(sched, today);
  const sum = monthSummary(sched);
  const upcoming = nextUpcoming(sched, today);

  const depDate =
    (status.kind === "flight-out" || status.kind === "flight-in") && status.leg?.dep
      ? dateAtKst(status.leg.date, status.leg.dep)
      : null;
  const clock = useClock(depDate);

  return (
    <>
      <div className="rise rise-2">
        <HeroCard status={status} today={today} clock={clock} />
      </div>

      {/* 이번 달 미니 요약 */}
      <section className="rise rise-2 glass rounded-2xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">{monthKey.replace("-", ".")} 총 비행시간</p>
            <p className="mt-1 font-display text-2xl font-extrabold leading-none tnum">
              {fmtDuration(sum.blockMinutes)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-sky-300">
              <PlaneIcon size={14} className="rotate-90" />
              <span className="font-mono text-xs tnum">{sum.flights}편 · {sum.trips}트립</span>
            </div>
            <Link to="/month" className="eyebrow text-sky-400 hover:text-sky-200">
              전체 보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* 다음 일정 */}
      <section className="rise rise-3">
        <p className="eyebrow mb-3 px-1">다음 일정</p>
        {upcoming.length === 0 ? (
          <p className="px-1 text-sm text-[var(--faint)]">예정된 일정이 없어요.</p>
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
                    <p className="truncate text-sm font-semibold">{u.label}</p>
                    {u.sub && <p className="font-mono text-xs text-[var(--muted)]">{u.sub}</p>}
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
  );
}

/* ─────────────── 스케줄 없을 때: 사진 업로드 가이드 ─────────────── */
function UploadView({ monthKey }: { monthKey: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isDrag, setIsDrag] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPhoto(url);
  }, []);

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(ANALYSIS_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="rise rise-2 space-y-4">
      {!photo ? (
        /* ── 드롭 존 ── */
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDrag(true); }}
          onDragLeave={() => setIsDrag(false)}
          onDrop={onDrop}
          className={`glass flex min-h-[22rem] cursor-pointer flex-col items-center justify-center gap-5 rounded-[28px] border-2 border-dashed transition-colors ${
            isDrag ? "border-sky-400/60 bg-sky-400/5" : "border-white/15 hover:border-white/25"
          }`}
        >
          <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={onInput} />
          <div
            className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-48 w-48 rounded-full opacity-30 blur-3xl"
            style={{ background: "radial-gradient(circle,#2f5fa6,transparent 70%)" }}
          />
          <div className="grid h-20 w-20 place-items-center rounded-3xl border border-white/10 bg-white/[0.04]">
            <CameraIcon />
          </div>
          <div className="text-center">
            <p className="font-display text-xl font-bold tracking-tight">
              {monthKey.replace("-", ".")} 스케줄 등록
            </p>
            <p className="mt-1.5 text-sm text-[var(--muted)]">
              캘린더 사진을 여기에 끌어놓거나
            </p>
            <p className="mt-0.5 text-sm text-[var(--muted)]">탭해서 선택하세요</p>
          </div>
          <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-5 py-2 text-sm font-semibold text-sky-300">
            사진 선택
          </span>
        </div>
      ) : (
        /* ── 사진 선택 후: 미리보기 + 분석 요청 ── */
        <div className="space-y-4">
          {/* 미리보기 */}
          <div className="relative overflow-hidden rounded-[24px]">
            <img src={photo} alt="스케줄 미리보기" className="w-full rounded-[24px] object-cover" style={{ maxHeight: "240px" }} />
            <button
              onClick={() => { setPhoto(null); if (inputRef.current) inputRef.current.value = ""; }}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm"
              aria-label="다시 선택"
            >
              <CloseIcon />
            </button>
          </div>

          {/* 분석 안내 */}
          <div className="glass rounded-[24px] p-5 space-y-4">
            <div>
              <p className="eyebrow">다음 단계</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                이 사진을 <b className="text-white">Claude</b>에게 보내고, 아래 분석 요청을 함께 붙여넣으면 스케줄 데이터가 만들어져요.
              </p>
            </div>

            <ol className="space-y-2.5 text-sm text-[var(--muted)]">
              {[
                "아래 버튼을 눌러 분석 요청 복사",
                "Claude.ai 열기 → 사진과 함께 붙여넣기",
                "받은 JSON을 Claude Code에 주면 앱이 자동 갱신"
              ].map((t, i) => (
                <li key={i} className="flex gap-3">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/8 text-[11px] font-bold text-sky-300">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{t}</span>
                </li>
              ))}
            </ol>

            <div className="flex gap-3 pt-1">
              <button
                onClick={copyPrompt}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition ${
                  copied
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "border border-white/12 bg-white/[0.05] text-white hover:bg-white/[0.09]"
                }`}
              >
                {copied ? "✓ 복사됨" : "분석 요청 복사"}
              </button>
              <a
                href="https://claude.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/15 py-3 text-sm font-semibold text-sky-200 hover:bg-sky-500/25 transition"
              >
                Claude.ai 열기
                <ArrowIcon size={15} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────── 히어로 카드 (상태별) ─────────────── */
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
        <h2 className="font-display text-3xl font-extrabold tracking-tight">오프</h2>
        <p className="mt-1.5 font-mono text-sm text-[var(--muted)]">{status.off?.code ?? "OFF"}</p>
      </StateHero>
    );
  }
  if (status.kind === "education") {
    return (
      <StateHero accent="#f0c46a" icon={<CapIcon size={26} />} eyebrow="교육">
        <h2 className="font-display text-3xl font-extrabold tracking-tight">교육</h2>
        <p className="mt-1.5 font-mono text-sm text-[var(--muted)]">
          {status.education?.from}–{status.education?.to}
          {status.education?.place ? ` · ${status.education.place}` : ""}
        </p>
      </StateHero>
    );
  }
  if (status.kind === "standby") {
    return (
      <StateHero accent="#7ca3c8" icon={<SunIcon size={26} />} eyebrow="대기">
        <h2 className="font-display text-3xl font-extrabold tracking-tight">대기</h2>
        <p className="mt-1.5 text-sm text-[var(--muted)]">배정된 비행이 없는 대기일이에요.</p>
      </StateHero>
    );
  }
  return (
    <StateHero accent="#9fb0cc" icon={<SunIcon size={26} />} eyebrow="일정 없음">
      <h2 className="font-display text-3xl font-extrabold tracking-tight">여유로운 하루</h2>
      <p className="mt-1.5 text-sm text-[var(--muted)]">예정된 비행이 없어요.</p>
    </StateHero>
  );
}

function StateHero({ accent, icon, eyebrow, children }: {
  accent: string; icon: ReactNode; eyebrow: string; children: ReactNode;
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
          style={{ borderColor: `${accent}40`, color: accent, background: `${accent}14` }}
        >
          {icon}
        </div>
        <div className="pt-1">
          <p className="eyebrow" style={{ color: accent }}>{eyebrow}</p>
          <div className="mt-1.5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function FlightHero({ status, today, clock }: {
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
        style={{ background: `radial-gradient(circle,${meta.accent},transparent 70%)` }}
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
        <div className="mt-7 flex items-end justify-between">
          <div>
            <p className="font-display text-[2.6rem] font-extrabold leading-none tracking-tight">{leg.from}</p>
            <p className="mt-1.5 font-mono text-sm text-[var(--muted)] tnum">{leg.dep ?? "--:--"}</p>
          </div>
          <div className="flex flex-1 flex-col items-center px-3 pb-2">
            <div className="flex w-full items-center text-[var(--faint)]">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <PlaneIcon size={18} className="mx-1 rotate-90 text-sky-300" />
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
            </div>
            <p className="mt-2 font-mono text-[11px] tracking-wide text-[var(--muted)]">{leg.flight ?? "—"}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-[2.6rem] font-extrabold leading-none tracking-tight">{leg.to}</p>
            <p className="mt-1.5 font-mono text-sm text-[var(--muted)] tnum">
              {leg.arr ?? "--:--"}
              {plus1 && <sup className="ml-0.5 text-[10px] text-amber-300">+1</sup>}
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
      <div className="relative">
        <span className="absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
        <span className="absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
        <div className="mx-6 border-t border-dashed border-white/15" />
      </div>
      <div className="relative grid grid-cols-2 gap-4 p-6">
        <div>
          <p className="eyebrow">리포팅 (추정)</p>
          <p className="mt-1 font-mono text-2xl font-bold tnum">{reporting ?? "--:--"}</p>
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

/* ─── 인라인 SVG 아이콘 ─── */
const CameraIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted)]">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);
const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
