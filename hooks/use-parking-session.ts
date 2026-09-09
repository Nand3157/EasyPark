"use client";

import * as React from "react";
import { usePersistentState } from "@/hooks/use-persistent-state";
import {
  SESSION_KEY,
  WARNING_MS,
  isParkingSession,
  type ParkingSession,
} from "@/lib/session";

function notify(title: string, body: string) {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    }
  } catch {
    // Notifications unavailable — the banner still shows the state.
  }
}

/**
 * Active parking session with a ticking clock. Persists to localStorage so a
 * reload doesn't lose the timer. Fires a 15-minute warning + expiry notice
 * via the Notifications API when permission was granted at start.
 */
export function useParkingSession() {
  const [session, setSession] = usePersistentState<ParkingSession | null>(
    SESSION_KEY,
    null,
    (v): v is ParkingSession | null => v === null || isParkingSession(v)
  );
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (!session) return;
    const id = window.setInterval(() => setNow(Date.now()), 10000);
    return () => window.clearInterval(id);
  }, [session]);

  // Reminder side-effects: 15-min warning once, expiry notice once.
  const expiredNotified = React.useRef(false);
  React.useEffect(() => {
    if (!session) {
      expiredNotified.current = false;
      return;
    }
    const remaining = session.endsAt - now;
    if (remaining <= 0 && !expiredNotified.current) {
      expiredNotified.current = true;
      notify("Parking expired", `${session.spotName} — move your car or extend.`);
    } else if (remaining > 0 && remaining <= WARNING_MS && !session.warned) {
      setSession({ ...session, warned: true });
      notify("15 minutes left", `${session.spotName} expires soon.`);
    }
  }, [session, now, setSession]);

  const startSession = React.useCallback(
    (spot: { id: number; name: string; lat: number; lng: number }, minutes: number) => {
      try {
        if ("Notification" in window && Notification.permission === "default") {
          void Notification.requestPermission();
        }
      } catch {
        // Ignore — banner works without it.
      }
      const startedAt = Date.now();
      setSession({
        spotId: spot.id,
        spotName: spot.name,
        lat: spot.lat,
        lng: spot.lng,
        startedAt,
        endsAt: startedAt + minutes * 60000,
        warned: minutes * 60000 <= WARNING_MS,
      });
      setNow(startedAt);
    },
    [setSession]
  );

  const extendSession = React.useCallback(
    (minutes: number) => {
      setSession((prev) => {
        if (!prev) return prev;
        const endsAt = Math.max(Date.now(), prev.endsAt) + minutes * 60000;
        return { ...prev, endsAt, warned: endsAt - Date.now() <= WARNING_MS ? true : prev.warned };
      });
    },
    [setSession]
  );

  const endSession = React.useCallback(() => setSession(null), [setSession]);

  const remainingMs = session ? session.endsAt - now : 0;

  return { session, now, remainingMs, startSession, extendSession, endSession };
}

export type ParkingSessionControls = ReturnType<typeof useParkingSession>;
