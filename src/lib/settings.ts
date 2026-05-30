const K = {
  ANTHROPIC: "roster_anthropic_key",
  GH_TOKEN: "roster_gh_token",
  GH_OWNER: "roster_gh_owner",
  GH_REPO: "roster_gh_repo",
  GH_BRANCH: "roster_gh_branch"
} as const;

function get(k: string) {
  try { return localStorage.getItem(k) ?? ""; } catch { return ""; }
}
function set(k: string, v: string) {
  try { localStorage.setItem(k, v); } catch { /* ignore */ }
}

export const Settings = {
  get anthropicKey() { return get(K.ANTHROPIC); },
  set anthropicKey(v: string) { set(K.ANTHROPIC, v); },

  get ghToken() { return get(K.GH_TOKEN); },
  set ghToken(v: string) { set(K.GH_TOKEN, v); },

  get ghOwner() { return get(K.GH_OWNER) || "sjidok750-creator"; },
  set ghOwner(v: string) { set(K.GH_OWNER, v); },

  get ghRepo() { return get(K.GH_REPO) || "sche"; },
  set ghRepo(v: string) { set(K.GH_REPO, v); },

  get ghBranch() { return get(K.GH_BRANCH) || "claude/practical-euler-PiM9i"; },
  set ghBranch(v: string) { set(K.GH_BRANCH, v); },

  isReady() { return !!this.anthropicKey; },
  canAutoPush() { return !!this.ghToken; }
};
