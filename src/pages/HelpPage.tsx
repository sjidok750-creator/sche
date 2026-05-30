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
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">설정</h1>
        {keys.length > 0 && (
          <p className="mt-1 text-xs text-[var(--muted)]">
            등록된 달: {keys.map(k => k.replace("-", ".")).join(", ")}
          </p>
        )}
      </header>

      <Section title="사용 방법" delay="rise-1">
        <ol className="space-y-3 text-sm text-[var(--muted)]">
          {[
            { t: "사진 선택", b: "홈 탭에서 스케줄 캘린더 사진을 선택해요. 여러 달을 한 번에 올려도 돼요." },
            { t: "분석 요청 복사 → Claude.ai", b: "자동으로 생성된 분석 요청을 복사하고 Claude.ai에서 사진과 함께 붙여넣으세요. 구독을 활용하므로 추가 비용 없어요." },
            { t: "JSON 붙여넣기 → 완료", b: "Claude가 돌려준 JSON을 앱에 붙여넣으면 즉시 반영돼요. GitHub 토큰이 있으면 자동 저장까지 됩니다." }
          ].map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/8 text-[11px] font-bold text-sky-300">{i + 1}</span>
              <div>
                <p className="font-semibold text-[var(--ink)]">{s.t}</p>
                <p className="mt-0.5 leading-relaxed">{s.b}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <OpenRouterSection />
      <GithubSection />
    </div>
  );
}

function OpenRouterSection() {
  const [key, setKey] = useState(Settings.orKey);
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = () => {
    Settings.orKey = key.trim();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Section title="AI 자동 분석 (무료)" delay="rise-2">
      <p className="mb-3 text-sm text-[var(--muted)]">
        OpenRouter 무료 키를 입력하면 사진만 올려도 자동 분석돼요 — 하루 200회 무료.{" "}
        <a
          href="https://openrouter.ai/keys"
          target="_blank" rel="noopener noreferrer"
          className="text-sky-400 underline-offset-2 hover:underline"
        >
          키 발급 →
        </a>
      </p>
      <div className="space-y-2">
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="sk-or-…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 font-mono text-sm text-white placeholder-[var(--faint)] outline-none focus:border-sky-500/40"
          />
          <button type="button" onClick={() => setShow(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--faint)] hover:text-[var(--muted)]">
            {show ? "숨기기" : "보기"}
          </button>
        </div>
        <button onClick={save}
          className={`w-full rounded-xl py-2.5 text-sm font-semibold transition ${
            saved ? "bg-emerald-500/20 text-emerald-300" : "bg-sky-500/20 text-sky-300 hover:bg-sky-500/30"
          }`}>
          {saved ? "✓ 저장됨" : "저장"}
        </button>
      </div>
      {Settings.isReady() && (
        <p className="mt-2 text-xs text-emerald-400">✓ AI 자동 분석 활성화됨</p>
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
        입력하면 JSON 붙여넣기 후 자동으로 커밋·배포까지 해요.{" "}
        <a
          href="https://github.com/settings/tokens/new?scopes=contents&description=Roster+App"
          target="_blank" rel="noopener noreferrer"
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
            onChange={e => setToken(e.target.value)}
            placeholder="ghp_…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 font-mono text-sm text-white placeholder-[var(--faint)] outline-none focus:border-sky-500/40"
          />
          <button type="button" onClick={() => setShow(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--faint)] hover:text-[var(--muted)]">
            {show ? "숨기기" : "보기"}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: owner, p: "owner", set: setOwner },
            { v: repo,  p: "repo",  set: setRepo  },
            { v: branch,p: "branch",set: setBranch }
          ].map(f => (
            <input key={f.p} value={f.v} onChange={e => f.set(e.target.value)} placeholder={f.p}
              className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white placeholder-[var(--faint)] outline-none focus:border-sky-500/40" />
          ))}
        </div>
        <button onClick={save}
          className={`w-full rounded-xl py-2.5 text-sm font-semibold transition ${
            saved ? "bg-emerald-500/20 text-emerald-300" : "bg-sky-500/20 text-sky-300 hover:bg-sky-500/30"
          }`}>
          {saved ? "✓ 저장됨" : "저장"}
        </button>
      </div>
      {Settings.canAutoPush() && (
        <p className="mt-2 text-xs text-emerald-400">✓ 자동 저장 설정됨 — {Settings.ghOwner}/{Settings.ghRepo}</p>
      )}
    </Section>
  );
}

function Section({ title, delay, children }: { title: string; delay: string; children: ReactNode }) {
  return (
    <section className={`rise ${delay} glass rounded-3xl p-5`}>
      <h2 className="mb-3 font-display text-base font-bold tracking-tight text-[var(--ink)]">{title}</h2>
      {children}
    </section>
  );
}
