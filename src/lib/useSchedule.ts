import { useCallback, useEffect, useState } from "react";
import type { RosterData, Schedule } from "../types";

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

type Updater = (updated: RosterData) => void;

export function useSchedule(): [State, Updater] {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
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
    setState({ status: "ok", data: updated });
  }, []);

  return [state, updater];
}
