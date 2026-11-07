import { useSyncExternalStore } from "react";
import { isOffline } from "@/lib/offline";
const subscribe = (notify: () => void) => {
  window.addEventListener("online", notify);
  window.addEventListener("offline", notify);
  return () => { window.removeEventListener("online", notify); window.removeEventListener("offline", notify); };
};
export const useOffline = () => useSyncExternalStore(subscribe, isOffline, () => false);