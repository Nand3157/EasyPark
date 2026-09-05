'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { MotionConfig } from 'motion/react';

const EasyParkApp = dynamic(() => import('./ParkSmartApp'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="size-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <p className="text-sm font-medium text-slate-400">Loading EasyPark…</p>
      </div>
    </div>
  ),
});

export default function ClientApp() {
  return (
    <MotionConfig reducedMotion="user">
      <EasyParkApp />
    </MotionConfig>
  );
}
