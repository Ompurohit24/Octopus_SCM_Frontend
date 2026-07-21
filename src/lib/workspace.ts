// Workspace-level UI state: auth, branch, financial year, dark mode, command palette.
// All stored to localStorage so the user's selection survives reloads.
import { useEffect, useState, useCallback, useSyncExternalStore } from "react";

const KEY = "octopus.scm.workspace.v1";

export interface WorkspaceUser {
  id: string;
  name: string;
  initials: string;
  role: string;
  email: string;
}

export interface WorkspaceState {
  user: WorkspaceUser | null;
  branch: string;
  fy: string;
  dark: boolean;
}

const DEFAULT_STATE: WorkspaceState = {
  user: null,
  branch: "Mumbai HQ",
  fy: "FY 2025-26",
  dark: false,
};

export const BRANCHES = ["Mumbai HQ", "Delhi", "Chennai", "Bangalore", "Cochin", "Kolkata"];
export const FYS = ["FY 2025-26", "FY 2024-25", "FY 2023-24"];

let memoryState: WorkspaceState = DEFAULT_STATE;
const listeners = new Set<() => void>();

function load(): WorkspaceState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

function persist(next: WorkspaceState) {
  memoryState = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    document.documentElement.classList.toggle("dark", next.dark);
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return memoryState;
}

function getServerSnapshot() {
  return DEFAULT_STATE;
}

let initialized = false;

export function useWorkspace() {
  // initialize once on client
  if (!initialized && typeof window !== "undefined") {
    memoryState = load();
    document.documentElement.classList.toggle("dark", memoryState.dark);
    initialized = true;
  }
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setBranch = useCallback((branch: string) => persist({ ...memoryState, branch }), []);
  const setFy = useCallback((fy: string) => persist({ ...memoryState, fy }), []);
  const setDark = useCallback((dark: boolean) => persist({ ...memoryState, dark }), []);
  const toggleDark = useCallback(() => persist({ ...memoryState, dark: !memoryState.dark }), []);
  const login = useCallback((user: WorkspaceUser) => persist({ ...memoryState, user }), []);
  const logout = useCallback(() => {
  localStorage.removeItem(
    "access_token",
  );

  localStorage.removeItem(
    "refresh_token",
  );

  persist({
    ...memoryState,
    user: null,
  });
}, []);

return {
  ...state,
  setBranch,
  setFy,
  setDark,
  toggleDark,
  login,
  logout,
};
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

// Simple "is authenticated" check usable in beforeLoad guards (client only).
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;

  const token = localStorage.getItem("access_token");
  if (!token) return false;

  const workspace = load();
  return workspace.user !== null;
}

// Convenience helpers
export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}
