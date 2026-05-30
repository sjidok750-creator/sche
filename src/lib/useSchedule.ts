import { useCallback, useEffect, useState } from "react";
import type { RosterData, Schedule } from "../types";

const LS_KEY = "roster_data";

type State =
  | { status: "loading" }
  | { status: "ok"; data: RosterData }
  | { status: "error"; error: string };

function normalize(raw: unknown): RosterData {
  if (raw && typeof raw === "object" && "months" in (raw as object)) {
    const months = (raw as RosterData).months;
    return { months: Array.isArray(months) ? months : [] };
  }
  if (raw && typeof raw === "object" && "month" in (raw as object)) {
    return { months: [raw as Schedule] };
  }
  return { months: [] };
}

function loadLocal(): RosterData | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return normalize(JSON.parse(raw));
  } catch { return null; }
}

function saveLocal(data: RosterData) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

type Updater = (updated: RosterData) => void;

export function useSchedule(): [State, Updater] {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    // Use localStorage data immediately if available
    const local = loadLocal();
    if (local && local.months.length > 0) {
      setState({ status: "ok", data: local });
      return;
    }

    // Otherwise fetch from public/schedule.json
    let alive = true;
    const url = `${import.meta.env.BASE_URL}schedule.json?t=${Date.now()}`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((raw) => {
        if (alive) setState({ status: "ok", data: normalize(raw) });
      })
      .catch((e) => {
        if (alive) setState({ status: "error", error: e?.message ?? "로드 실패" });
      });
    return () => { alive = false; };
  }, []);

  const updater = useCallback((updated: RosterData) => {
    saveLocal(updated);
    setState({ status: "ok", data: updated });
  }, []);

  return [state, updater];
}
