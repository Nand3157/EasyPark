'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const EasyParkApp = dynamic(() => import('./ParkSmartApp'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400 font-medium">Loading EasyPark Smart...</p>
      </div>
    </div>
  ),
});

export default function ClientApp() {
  return <EasyParkApp />;
}
