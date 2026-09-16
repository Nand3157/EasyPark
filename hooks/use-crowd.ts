"use client";

import * as React from "react";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { CROWD_KEY, isCrowdMap, type CrowdLevel, type CrowdReport } from "@/lib/crowd";

export function useCrowd() {
  const [crowdMap, setCrowdMap] = usePersistentState<Record<string, CrowdReport>>(CROWD_KEY, {}, isCrowdMap);
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const report = React.useCallback(
    (spotId: number, level: CrowdLevel) => {
      setCrowdMap((prev) => ({
        ...prev,
        [String(spotId)]: { spotId, level, at: Date.now() },
      }));
      setNow(Date.now());
    },
    [setCrowdMap]
  );

  return { crowdMap, report, now };
}
