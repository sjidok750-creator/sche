import { useState, type ReactNode } from "react";
import type { RosterData } from "../types";
import { monthKeys } from "../lib/schedule";
import { Settings } from "../lib/settings";

export default function HelpPage({ data }: { data: RosterData }) {
  const keys = monthKeys(data);
  return (
    <div className="space-y-6">
      <header className="rise rise-1">
        <p className="eyebrow">환경 설정</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">
          설정
        </h1>
        {keys.length > 0 && (
          <p className="mt-1 text-xs text-[var(--muted)]">
            등록된 달: {keys.map((k) => k.replace("-", ".")).join(", ")}
          </p>
        )}
      </header>

      {/* ── Anthropic API 키 ── */}
      <ApiKeySection />

      {/* ── GitHub 자동 저장 ── */}
      <GithubSection />

      {/* ── 앱 사용법 ── */}
      <Section title="사용 방법" delay="rise-3">
        <ol className="space-y-3 text-sm text-[var(--muted)]">
          {[
            { title: "API 키 입력 (최초 1회)", body: "Anthropic API 키를 위에 입력하세요. console.anthropic.com에서 발급받을 수 있어요." },
            { title: "사진만 올리면 끝", body: "홈 화면에서 스케줄 캘린더 사진을 선택하면 Claude가 자동 분석해서 앱에 반영해요. 여러 달을 한 번에 올려도 돼요." },
            { title: "자동 저장 (선택)", body: "GitHub 토큰을 입력하면 분석 후 자동으로 커밋·배포까지 해요. 토큰이 없으면 JSON 다운로드 버튼으로 수동 저장할 수 있어요." }
          ].map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/8 text-[11px] font-bold text-sky-300">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-[var(--ink)]">{s.title}</p>
                <p className="mt-0.5 leading-relaxed">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}

function ApiKeySection() {
  const [key, setKey] = useState(Settings.anthropicKey);
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = () => {
    Settings.anthropicKey = key.trim();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Section title="Anthropic API 키" delay="rise-1">
      <p className="mb-3 text-sm text-[var(--muted)]">
        사진 자동 분석에 사용해요.{" "}
        <a
          href="https://console.anthropic.com/settings/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-400 underline-offset-2 hover:underline"
        >
          키 발급 →
        </a>
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? "text" : "password"}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="sk-ant-…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 font-mono text-sm text-white placeholder-[var(--faint)] outline-none focus:border-sky-500/40 focus:ring-1 focus:ring-sky-500/20"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--faint)] hover:text-[var(--muted)]"
          >
            {show ? "숨기기" : "보기"}
          </button>
        </div>
        <button
          onClick={save}
          className={`rounded-xl px-4 text-sm font-semibold transition ${
            saved
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-sky-500/20 text-sky-300 hover:bg-sky-500/30"
          }`}
        >
          {saved ? "✓" : "저장"}
        </button>
      </div>
      {Settings.isReady() && (
        <p className="mt-2 text-xs text-emerald-400">✓ API 키 설정됨</p>
      )}
    </Section>
  );
}

function GithubSection() {
  const [token, setToken] = useState(Settings.ghToken);
  const [owner, setOwner] = useState(Settings.ghOwner);
  const [repo, setRepo] = useState(Settings.ghRepo);
  const [branch, setBranch] = useState(Settings.ghBranch);
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = () => {
    Settings.ghToken = token.trim();
    Settings.ghOwner = owner.trim();
    Settings.ghRepo = repo.trim();
    Settings.ghBranch = branch.trim();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Section title="GitHub 자동 저장 (선택)" delay="rise-2">
      <p className="mb-3 text-sm text-[var(--muted)]">
        입력하면 분석 후 자동으로 커밋·배포까지 해요.{" "}
        <a
          href="https://github.com/settings/tokens/new?scopes=contents&description=Roster+App"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-400 underline-offset-2 hover:underline"
        >
          토큰 발급(contents 권한) →
        </a>
      </p>
      <div className="space-y-2">
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 font-mono text-sm text-white placeholder-[var(--faint)] outline-none focus:border-sky-500/40"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--faint)] hover:text-[var(--muted)]"
          >
            {show ? "숨기기" : "보기"}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="owner"
            className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white placeholder-[var(--faint)] outline-none focus:border-sky-500/40"
          />
          <input
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="repo"
            className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white placeholder-[var(--faint)] outline-none focus:border-sky-500/40"
          />
          <input
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="branch"
            className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white placeholder-[var(--faint)] outline-none focus:border-sky-500/40"
          />
        </div>
        <button
          onClick={save}
          className={`w-full rounded-xl py-2.5 text-sm font-semibold transition ${
            saved
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-sky-500/20 text-sky-300 hover:bg-sky-500/30"
          }`}
        >
          {saved ? "✓ 저장됨" : "저장"}
        </button>
      </div>
      {Settings.canAutoPush() && (
        <p className="mt-2 text-xs text-emerald-400">
          ✓ 자동 저장 설정됨 — {Settings.ghOwner}/{Settings.ghRepo}
        </p>
      )}
    </Section>
  );
}

function Section({
  title,
  delay,
  children
}: {
  title: string;
  delay: string;
  children: ReactNode;
}) {
  return (
    <section className={`rise ${delay} glass rounded-3xl p-5`}>
      <h2 className="mb-3 font-display text-base font-bold tracking-tight text-[var(--ink)]">
        {title}
      </h2>
      {children}
    </section>
  );
}
