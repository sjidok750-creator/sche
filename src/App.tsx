import { NavLink, Route, Routes, Navigate } from "react-router-dom";
import { useSchedule } from "./lib/useSchedule";
import TodayPage from "./pages/TodayPage";
import MonthPage from "./pages/MonthPage";
import HelpPage from "./pages/HelpPage";

const tabs = [
  { to: "/today", label: "오늘", icon: "✈️" },
  { to: "/month", label: "이번 달", icon: "🗓️" },
  { to: "/help", label: "도움말", icon: "❓" }
];

export default function App() {
  const state = useSchedule();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <main className="safe-top flex-1 px-4 pb-28 pt-3">
        {state.status === "loading" && (
          <div className="grid h-[60vh] place-items-center text-slate-400">
            불러오는 중…
          </div>
        )}
        {state.status === "error" && (
          <div className="grid h-[60vh] place-items-center px-6 text-center text-slate-400">
            <div>
              <p className="text-rose-300">스케줄을 불러오지 못했어요.</p>
              <p className="mt-2 text-sm">{state.error}</p>
              <p className="mt-2 text-xs text-slate-500">
                schedule.json 경로를 확인하세요.
              </p>
            </div>
          </div>
        )}
        {state.status === "ok" && (
          <Routes>
            <Route path="/" element={<Navigate to="/today" replace />} />
            <Route path="/today" element={<TodayPage data={state.data} />} />
            <Route path="/month" element={<MonthPage data={state.data} />} />
            <Route path="/help" element={<HelpPage data={state.data} />} />
            <Route path="*" element={<Navigate to="/today" replace />} />
          </Routes>
        )}
      </main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t border-white/10 bg-[#091428]/95 px-2 pt-2 backdrop-blur">
        <ul className="flex">
          {tabs.map((t) => (
            <li key={t.to} className="flex-1">
              <NavLink
                to={t.to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-xs transition ${
                    isActive
                      ? "text-sky-300"
                      : "text-slate-400 hover:text-slate-200"
                  }`
                }
              >
                <span className="text-lg leading-none">{t.icon}</span>
                <span>{t.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
