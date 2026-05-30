import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode
} from "react";
import { Link } from "react-router-dom";
import type { RosterData, Schedule } from "../types";
import {
  CATEGORY_META,
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
  return {
    h: pad(Math.floor(diff / 3600)),
    m: pad(Math.floor((diff % 3600) / 60)),
    s: pad(diff % 60),
    past
  };
}

/* ─────────────────────────────── */
type FileStatus =
  | { phase: "pending" }
  | { phase: "analyzing" }
  | { phase: "done"; schedule: Schedule }
  | { phase: "error"; msg: string };

interface FileItem {
  id: string;
  file: File;
  preview: string;
  status: FileStatus;
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
  const sched = findMonth(data, monthKey);
  const [, mm, dd] = today.split("-");

  return (
    <div className="space-y-6">
      <header className="rise rise-1 flex items-end justify-between">
        <div>
          <p className="eyebrow">오늘 · {weekday(today)}요일</p>
          <h1 className="mt-1 font-display text-[2.7rem] font-extrabold leading-none tracking-tight tnum">
            {mm}
            <span className="text-[var(--faint)]">.</span>
            {dd}
          </h1>
        </div>
        <p className="eyebrow pb-1 tnum">{monthKey}</p>
      </header>

      {sched ? (
        <ScheduleView
          sched={sched}
          today={today}
          monthKey={monthKey}
          data={data}
          onDataUpdate={onDataUpdate}
        />
      ) : (
        <UploadZone data={data} onDataUpdate={onDataUpdate} monthKey={monthKey} />
      )}
    </div>
  );
}

/* ─── 스케줄 있을 때 ─── */
function ScheduleView({
  sched,
  today,
  monthKey,
  data,
  onDataUpdate
}: {
  sched: Schedule;
  today: string;
  monthKey: string;
  data: RosterData;
  onDataUpdate: (d: RosterData) => void;
}) {
  const status = resolveToday(sched, today);
  const sum = monthSummary(sched);
  const upcoming = nextUpcoming(sched, today);
  const [showUpload, setShowUpload] = useState(false);

  const depDate =
    (status.kind === "flight-out" || status.kind === "flight-in") &&
    status.leg?.dep
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
          <div className="flex flex-col items-end gap-1.5">
            <p className="font-mono text-xs text-sky-300 tnum">
              {sum.flights}편 · {sum.trips}트립
            </p>
            <div className="flex gap-3">
              <Link
                to="/month"
                className="eyebrow text-sky-400 hover:text-sky-200"
              >
                전체 보기 →
              </Link>
              <button
                onClick={() => setShowUpload((v) => !v)}
                className="eyebrow text-[var(--faint)] hover:text-[var(--muted)]"
              >
                {showUpload ? "닫기" : "+ 스케줄 추가"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {showUpload && (
        <div className="rise rise-1">
          <UploadZone
            data={data}
            onDataUpdate={(d) => {
              onDataUpdate(d);
              setShowUpload(false);
            }}
            monthKey={monthKey}
            compact
          />
        </div>
      )}

      {/* 다음 일정 */}
      {!showUpload && (
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
                      <p className="truncate text-sm font-semibold">
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
      )}
    </>
  );
}

/* ─── 업로드 존 ─── */
function UploadZone({
  data,
  onDataUpdate,
  compact = false
}: {
  data: RosterData;
  onDataUpdate: (d: RosterData) => void;
  monthKey?: string;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<FileItem[]>([]);
  const [isDrag, setIsDrag] = useState(false);
  const [pushState, setPushState] = useState<
    "idle" | "pushing" | "done" | "error"
  >("idle");
  const [pushErr, setPushErr] = useState("");

  const hasApiKey = Settings.isReady();

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return;
    const newItems: FileItem[] = arr.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      status: { phase: "pending" }
    }));
    setItems((prev) => [...prev, ...newItems]);
    // 바로 분석 시작
    if (hasApiKey) {
      processFiles(newItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasApiKey, data]);

  const processFiles = useCallback(
    async (newItems: FileItem[]) => {
      const apiKey = Settings.anthropicKey;
      let currentData = data;

      for (const item of newItems) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? { ...it, status: { phase: "analyzing" } }
              : it
          )
        );
        try {
          const schedule = await analyzeImage(item.file, apiKey);
          currentData = mergeMonth(currentData, schedule);
          onDataUpdate(currentData);

          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? { ...it, status: { phase: "done", schedule } }
                : it
            )
          );
        } catch (e) {
          const msg = e instanceof Error ? e.message : "분석 실패";
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? { ...it, status: { phase: "error", msg } }
                : it
            )
          );
        }
      }

      // 모두 완료 후 GitHub 자동 푸시
      if (Settings.canAutoPush()) {
        setPushState("pushing");
        try {
          await pushScheduleJson(currentData);
          setPushState("done");
        } catch (e) {
          setPushErr(e instanceof Error ? e.message : "푸시 실패");
          setPushState("error");
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, onDataUpdate]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDrag(false);
    addFiles(e.dataTransfer.files);
  };

  const allDone =
    items.length > 0 && items.every((it) => it.status.phase === "done");

  // 분석 완료 후 자동으로 schedule.json 다운로드 제공 (GitHub 토큰 없을 때)
  const downloadJson = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schedule.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {/* API 키 없으면 설정 안내 */}
      {!hasApiKey && (
        <div className="glass rounded-2xl border border-amber-400/20 px-4 py-3 text-sm">
          <p className="font-semibold text-amber-300">API 키 설정이 필요해요</p>
          <p className="mt-1 text-[var(--muted)]">
            설정 탭에서 Anthropic API 키를 입력하면 사진 올리기만으로 자동 분석돼요.
          </p>
          <Link
            to="/help"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-sky-300"
          >
            설정하러 가기 <ArrowIcon size={13} />
          </Link>
        </div>
      )}

      {/* 드롭 존 */}
      {(!allDone || items.length === 0) && (
        <div
          onClick={() => hasApiKey && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (hasApiKey) setIsDrag(true);
          }}
          onDragLeave={() => setIsDrag(false)}
          onDrop={onDrop}
          className={`glass flex flex-col items-center justify-center gap-4 rounded-[24px] border-2 border-dashed transition-colors ${
            compact ? "py-8" : "min-h-[20rem]"
          } ${
            !hasApiKey
              ? "cursor-not-allowed opacity-40 border-white/10"
              : isDrag
              ? "cursor-copy border-sky-400/60 bg-sky-400/5"
              : "cursor-pointer border-white/15 hover:border-white/30"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
          <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <CameraIcon />
          </div>
          {!compact && (
            <div className="text-center">
              <p className="font-display text-lg font-bold tracking-tight">
                스케줄 사진 올리기
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                여러 달을 한 번에 올려도 돼요
              </p>
            </div>
          )}
          <span
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              hasApiKey
                ? "border border-sky-400/30 bg-sky-400/10 text-sky-300"
                : "border border-white/10 bg-white/5 text-[var(--faint)]"
            }`}
          >
            {compact ? "사진 추가" : "사진 선택 (여러 장 가능)"}
          </span>
        </div>
      )}

      {/* 파일 목록 + 상태 */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <FileRow key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* GitHub 자동 푸시 상태 */}
      {allDone && (
        <div
          className={`glass rounded-2xl px-4 py-3 text-sm ${
            pushState === "done"
              ? "border border-emerald-400/20"
              : pushState === "error"
              ? "border border-rose-400/20"
              : ""
          }`}
        >
          {pushState === "idle" && !Settings.canAutoPush() && (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-emerald-300">
                  ✓ 분석 완료 — 앱에 반영됨
                </p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  GitHub 토큰을 설정하면 자동 저장돼요.
                </p>
              </div>
              <button
                onClick={downloadJson}
                className="rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
              >
                JSON 다운로드
              </button>
            </div>
          )}
          {pushState === "pushing" && (
            <p className="text-sky-300">
              <span className="inline-block animate-spin mr-2">⟳</span>
              GitHub에 저장 중…
            </p>
          )}
          {pushState === "done" && (
            <p className="font-semibold text-emerald-300">
              ✓ GitHub에 저장됨 — 1~2분 후 앱이 자동 갱신돼요
            </p>
          )}
          {pushState === "error" && (
            <div>
              <p className="font-semibold text-rose-300">저장 실패</p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">{pushErr}</p>
              <button
                onClick={downloadJson}
                className="mt-2 rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
              >
                JSON 다운로드 (수동 저장)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FileRow({ item }: { item: FileItem }) {
  const { status } = item;
  return (
    <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
      <img
        src={item.preview}
        alt=""
        className="h-12 w-12 shrink-0 rounded-xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{item.file.name}</p>
        <div className="mt-0.5">
          {status.phase === "pending" && (
            <p className="text-xs text-[var(--faint)]">대기 중…</p>
          )}
          {status.phase === "analyzing" && (
            <p className="flex items-center gap-1.5 text-xs text-sky-300">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
              Claude가 분석 중…
            </p>
          )}
          {status.phase === "done" && (
            <p className="text-xs font-semibold text-emerald-400">
              ✓ {status.schedule.month} 완료
            </p>
          )}
          {status.phase === "error" && (
            <p className="truncate text-xs text-rose-400">{status.msg}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── 히어로 카드 (상태별) ─── */
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
  if (status.kind === "standby") {
    return (
      <StateHero accent="#7ca3c8" icon={<SunIcon size={26} />} eyebrow="대기">
        <h2 className="font-display text-3xl font-extrabold tracking-tight">
          대기
        </h2>
        <p className="mt-1.5 text-sm text-[var(--muted)]">
          배정된 비행이 없는 대기일이에요.
        </p>
      </StateHero>
    );
  }
  return (
    <StateHero accent="#9fb0cc" icon={<SunIcon size={26} />} eyebrow="일정 없음">
      <h2 className="font-display text-3xl font-extrabold tracking-tight">
        여유로운 하루
      </h2>
      <p className="mt-1.5 text-sm text-[var(--muted)]">
        예정된 비행이 없어요.
      </p>
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
      <div className="relative">
        <span className="absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
        <span className="absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
        <div className="mx-6 border-t border-dashed border-white/15" />
      </div>
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
            {clock
              ? `${clock.h}:${clock.m}:${clock.s}`
              : "--:--:--"}
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--faint)]">현지 기준</p>
        </div>
      </div>
    </div>
  );
}

const CameraIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-[var(--muted)]"
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);
