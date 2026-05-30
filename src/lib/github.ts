import type { RosterData } from "../types";
import { Settings } from "./settings";

const API = "https://api.github.com";

async function getSha(path: string, token: string): Promise<string | undefined> {
  const { ghOwner: owner, ghRepo: repo, ghBranch: branch } = Settings;
  const res = await fetch(
    `${API}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
  );
  if (!res.ok) return undefined;
  const json = await res.json() as { sha?: string };
  return json.sha;
}

export async function pushScheduleJson(data: RosterData): Promise<void> {
  const token = Settings.ghToken;
  if (!token) throw new Error("GitHub 토큰이 설정되지 않았어요.");

  const { ghOwner: owner, ghRepo: repo, ghBranch: branch } = Settings;
  const path = "public/schedule.json";

  const sha = await getSha(path, token);
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2) + "\n")));

  const months = data.months.map((m) => m.month).join(", ");
  const body: Record<string, string> = {
    message: `스케줄 업데이트 (${months})`,
    content,
    branch
  };
  if (sha) body.sha = sha;

  const res = await fetch(`${API}/repos/${owner}/${repo}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? `GitHub API ${res.status}`);
  }
}
