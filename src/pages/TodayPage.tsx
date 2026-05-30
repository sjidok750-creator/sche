import {
  useCallback,
  useRef,
  useState,
  useEffect,
  type ReactNode
} from "react";
import { Link } from "react-router-dom";
import type { RosterData, Schedule } from "../types";
import {
  categoryMeta,
  currentMonthKey,
  dateAtKst,
  ddayLabel,
  findMonth,
  fmtDuration,
  kstToday,
  monthSummary,
  nextUpcoming,
  reportingTime,
  resolveToday
} from "../lib/schedule";
import { Settings } from "../lib/settings";
import { analyzeImage } from "../lib/analyze";
import { pushScheduleJson } from "../lib/github";
import {
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

function mergeMonth(data: RosterData, sched: Schedule): RosterData {
  const months = data.months.filter((m) => m.month !== sched.month);
  months.push(sched);
  months.sort((a, b) => a.month.localeCompare(b.month));
  return { months };
}

/* ─────────────────────────────── */
export default function TodayPage({
  data,
  onDataUpdate
}: {
  data: RosterData;
  onDataUpdate: (d: RosterData) => void;
}) {
  const today = kstToday();
  const monthKey = currentMonthKey(today);
  // Prefer current month; fall back to nearest available month
  const sched = findMonth(data, monthKey)
    ?? (data.months.length > 0 ? data.months[data.months.length - 1] : null);
  const activeMonthKey = sched?.month ?? monthKey;
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
        <p className="eyebrow pb-1 tnum">{activeMonthKey}</p>
      </header>

      {sched ? (
        <ScheduleView sched={sched} today={today} monthKey={activeMonthKey} data={data} onDataUpdate={onDataUpdate} />
      ) : (
        <UploadFlow data={data} onDataUpdate={onDataUpdate} />
      )}
    </div>
  );
}

/* ─── 스케줄 있을 때 ─── */
function ScheduleView({ sched, today, monthKey, data, onDataUpdate }: {
  sched: Schedule; today: string; monthKey: string;
  data: RosterData; onDataUpdate: (d: RosterData) => void;
}) {
  const status = resolveToday(sched, today);
  const sum = monthSummary(sched);
  const upcoming = nextUpcoming(sched, today);
  const [showUpload, setShowUpload] = useState(false);
  const depDate =
    (status.kind === "flight-out" || status.kind === "flight-in") && status.leg?.dep
      ? dateAtKst(status.leg.date, status.leg.dep) : null;
  const clock = useClock(depDate);

  return (
    <>
      <div className="rise rise-2">
        <HeroCard status={status} today={today} clock={clock} />
      </div>

      <section className="rise rise-2 glass rounded-2xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">{monthKey.replace("-", ".")} 총 비행시간</p>
            <p className="mt-1 font-display text-2xl font-extrabold leading-none tnum">
              {fmtDuration(sum.blockMinutes)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <p className="font-mono text-xs text-sky-300 tnum">{sum.flights}편 · {sum.trips}트립</p>
            <div className="flex gap-3">
              <Link to="/month" className="eyebrow text-sky-400 hover:text-sky-200">전체 보기 →</Link>
              <button onClick={() => setShowUpload(v => !v)} className="eyebrow text-[var(--faint)] hover:text-[var(--muted)]">
                {showUpload ? "닫기" : "+ 스케줄 추가"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {showUpload && (
        <div className="rise rise-1">
          <UploadFlow data={data} onDataUpdate={(d) => { onDataUpdate(d); setShowUpload(false); }} compact />
        </div>
      )}

      {!showUpload && (
        <section className="rise rise-3">
          <p className="eyebrow mb-3 px-1">다음 일정</p>
          {upcoming.length === 0
            ? <p className="px-1 text-sm text-[var(--faint)]">예정된 일정이 없어요.</p>
            : (
              <ol className="relative space-y-2.5 pl-1">
                {upcoming.map((u, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex flex-col items-center self-stretch">
                      <span className="mt-3.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/70" />
                      {i < upcoming.length - 1 && <span className="w-px flex-1 bg-white/10" />}
                    </div>
                    <div className="glass mb-0.5 flex flex-1 items-center justify-between rounded-2xl px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{u.label}</p>
                        {u.sub && <p className="font-mono text-xs text-[var(--muted)]">{u.sub}</p>}
                      </div>
                      <div className="pl-3 text-right">
                        <p className="font-mono text-[11px] text-[var(--faint)] tnum">{u.date.slice(5).replace("-", ".")}</p>
                        <p className="text-xs font-bold text-sky-300 tnum">{ddayLabel(u.date, today)}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )
          }
        </section>
      )}
    </>
  );
}

/* ─── 업로드 플로우 (연/월 지정 → 한 장 분석) ─── */
type Step = "select" | "analyzing" | "done";

function UploadFlow({ data, onDataUpdate, compact = false }: {
  data: RosterData; onDataUpdate: (d: RosterData) => void; compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [step, setStep] = useState<Step>("select");
  const [preview, setPreview] = useState<string>("");
  const [errMsg, setErrMsg] = useState("");
  const [pushErr, setPushErr] = useState("");

  const monthKey = `${year}-${month}`;
  const hasKey = Settings.isReady();

  const handleFile = useCallback(async (file: File) => {
    setPreview(URL.createObjectURL(file));
    setStep("analyzing");
    setErrMsg(""); setPushErr("");
    try {
      const sched = await analyzeImage(file, Settings.anthropicKey);
      // 사용자가 지정한 연/월로 강제 — AI 오독 방지
      sched.month = monthKey;
      const updated = mergeMonth(data, sched);
      onDataUpdate(updated);
      if (Settings.canAutoPush()) {
        try { await pushScheduleJson(updated); }
        catch (e) { setPushErr(e instanceof Error ? e.message : "GitHub 저장 실패"); }
      }
      setStep("done");
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : "분석 실패");
      setStep("done");
    }
  }, [data, monthKey, onDataUpdate]);

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - 1 + i);
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

  /* ── 분석 중 / 완료 ── */
  if (step === "analyzing" || step === "done") {
    const ok = step === "done" && !errMsg;
    return (
      <div className="space-y-3">
        <div className="glass rounded-[24px] p-5 space-y-4">
          <p className="eyebrow text-sky-400">
            {step === "analyzing" ? `${monthKey.replace("-", ".")} 분석 중…` : ok ? "✓ 분석 완료" : "분석 실패"}
          </p>
          <div className="flex items-center gap-3">
            {preview && <img src={preview} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-white/15" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--ink)]">{monthKey.replace("-", ".")} 스케줄</p>
              {step === "analyzing" && <p className="mt-0.5 text-xs text-sky-300 animate-pulse">AI가 사진을 읽고 있어요…</p>}
              {ok && <p className="mt-0.5 text-xs text-emerald-400">앱에 반영됐어요</p>}
              {errMsg && <p className="mt-0.5 break-words text-xs text-rose-400">{errMsg}</p>}
            </div>
          </div>
          {pushErr && <p className="text-xs text-amber-400">GitHub 저장 실패: {pushErr} (앱에는 반영됨)</p>}
          {step === "done" && (
            <button
              onClick={() => { setStep("select"); setPreview(""); setErrMsg(""); }}
              className={`w-full rounded-xl py-2.5 text-sm font-semibold transition ${
                ok ? "bg-sky-500/20 text-sky-200 hover:bg-sky-500/30" : "border border-white/10 text-white/70 hover:bg-white/[0.04]"
              }`}
            >
              {ok ? "확인" : "다시 시도"}
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ── 선택 화면: 연/월 지정 + 사진 한 장 ── */
  return (
    <div className="space-y-4">
      {!hasKey && (
        <div className="glass rounded-2xl border border-amber-400/20 px-4 py-3">
          <p className="text-sm font-semibold text-amber-300">먼저 API 키가 필요해요</p>
          <Link to="/help" className="mt-1 inline-block text-xs text-sky-400 hover:text-sky-200">설정 → AI 자동 분석에서 입력 →</Link>
        </div>
      )}

      <div className="glass rounded-[24px] p-5 space-y-4">
        <div>
          <p className="eyebrow text-sky-400">어느 달 스케줄인가요?</p>
          <p className="mt-1 text-xs text-[var(--muted)]">연·월을 정확히 골라주세요. 이 값으로 저장돼요.</p>
        </div>
        <div className="flex gap-2">
          <select value={year} onChange={e => setYear(e.target.value)}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white outline-none focus:border-sky-500/40">
            {years.map(y => <option key={y} value={y} className="bg-slate-900">{y}년</option>)}
          </select>
          <select value={month} onChange={e => setMonth(e.target.value)}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white outline-none focus:border-sky-500/40">
            {months.map(m => <option key={m} value={m} className="bg-slate-900">{Number(m)}월</option>)}
          </select>
        </div>
      </div>

      <div
        onClick={() => hasKey && inputRef.current?.click()}
        className={`glass flex flex-col items-center justify-center gap-4 rounded-[24px] border-2 border-dashed transition-colors ${
          compact ? "py-8" : "min-h-[14rem]"
        } ${hasKey ? "cursor-pointer border-white/15 hover:border-white/30" : "border-white/10 opacity-50"}`}
      >
        <input ref={inputRef} type="file" accept="image/*" className="sr-only"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
          <CameraIcon />
        </div>
        {!compact && (
          <div className="text-center">
            <p className="font-display text-lg font-bold tracking-tight">{monthKey.replace("-", ".")} 사진 올리기</p>
            <p className="mt-1 text-sm text-[var(--muted)]">한 달에 한 장씩 올려주세요</p>
          </div>
        )}
        <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-5 py-2 text-sm font-semibold text-sky-300">
          사진 선택
        </span>
      </div>
    </div>
  );
}

/* ─── 히어로 카드 ─── */
function HeroCard({ status, today, clock }: {
  status: ReturnType<typeof resolveToday>; today: string; clock: ReturnType<typeof useClock>;
}) {
  if (status.kind === "flight-out" || status.kind === "flight-in") return <FlightHero status={status} today={today} clock={clock} />;
  if (status.kind === "layover") {
    const trip = status.trip!; const meta = categoryMeta(trip.category);
    return (
      <StateHero accent={meta.accent} icon={<HotelIcon size={26} />} eyebrow="레이오버">
        <h2 className="font-display text-3xl font-extrabold tracking-tight">{trip.layover?.city ?? trip.destination?.city ?? ""}</h2>
        <p className="mt-1.5 font-mono text-sm text-[var(--muted)]">{trip.destination?.code ?? "—"} · {trip.destination?.country ?? ""}{trip.layover && ` · ${trip.layover.nights}박`}</p>
      </StateHero>
    );
  }
  if (status.kind === "off") return (
    <StateHero accent="#6ee7a8" icon={<MoonIcon size={26} />} eyebrow="휴무">
      <h2 className="font-display text-3xl font-extrabold tracking-tight">오프</h2>
      <p className="mt-1.5 font-mono text-sm text-[var(--muted)]">{status.off?.code ?? "OFF"}</p>
    </StateHero>
  );
  if (status.kind === "education") return (
    <StateHero accent="#f0c46a" icon={<CapIcon size={26} />} eyebrow="교육">
      <h2 className="font-display text-3xl font-extrabold tracking-tight">교육</h2>
      <p className="mt-1.5 font-mono text-sm text-[var(--muted)]">{status.education?.from}–{status.education?.to}{status.education?.place ? ` · ${status.education.place}` : ""}</p>
    </StateHero>
  );
  if (status.kind === "standby") return (
    <StateHero accent="#7ca3c8" icon={<SunIcon size={26} />} eyebrow="대기">
      <h2 className="font-display text-3xl font-extrabold tracking-tight">대기</h2>
      <p className="mt-1.5 text-sm text-[var(--muted)]">배정된 비행이 없는 대기일이에요.</p>
    </StateHero>
  );
  return (
    <StateHero accent="#9fb0cc" icon={<SunIcon size={26} />} eyebrow="일정 없음">
      <h2 className="font-display text-3xl font-extrabold tracking-tight">여유로운 하루</h2>
      <p className="mt-1.5 text-sm text-[var(--muted)]">예정된 비행이 없어요.</p>
    </StateHero>
  );
}

function StateHero({ accent, icon, eyebrow, children }: { accent: string; icon: ReactNode; eyebrow: string; children: ReactNode; }) {
  return (
    <div className="glass relative overflow-hidden rounded-[28px] p-7">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-30 blur-3xl"
        style={{ background: `radial-gradient(circle,${accent},transparent 70%)` }} />
      <div className="relative flex items-start gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border"
          style={{ borderColor: `${accent}40`, color: accent, background: `${accent}14` }}>
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

function FlightHero({ status, today, clock }: { status: ReturnType<typeof resolveToday>; today: string; clock: ReturnType<typeof useClock>; }) {
  const trip = status.trip!; const leg = status.leg!;
  const meta = categoryMeta(trip.category);
  const reporting = reportingTime(leg.dep);
  const dirLabel = leg.dir === "out" ? "출발" : "복귀";
  const plus1 = leg.arrDate && leg.arrDate !== leg.date;
  return (
    <div className="glass relative overflow-hidden rounded-[28px]">
      <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full opacity-30 blur-3xl"
        style={{ background: `radial-gradient(circle,${meta.accent},transparent 70%)` }} />
      <div className="relative p-6">
        <div className="flex items-center justify-between">
          <span className="rounded-full px-3 py-1 text-[11px] font-bold tracking-wide" style={{ background: `${meta.accent}1f`, color: meta.accent }}>
            {meta.label} · {dirLabel}
          </span>
          <span className="font-mono text-sm font-bold text-sky-200 tnum">{ddayLabel(leg.date, today)}</span>
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
              {leg.arr ?? "--:--"}{plus1 && <sup className="ml-0.5 text-[10px] text-amber-300">+1</sup>}
            </p>
          </div>
        </div>
        <p className="mt-4 flex items-center gap-2 text-sm text-[var(--muted)]">
          {trip.destination?.city ?? ""}
          {leg.redeye && <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-200">레드아이</span>}
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

const CameraIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted)]">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);
