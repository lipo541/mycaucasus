"use client";
import React, { createContext, useContext } from 'react';

export type PilotCtx = {
  role: string | null;
  pilotKind: string | null;
  isPilot: boolean;
  isSolo: boolean;
  isTandem: boolean;
};

const Ctx = createContext<PilotCtx | null>(null);

export function PilotProvider({ value, children }: { value: PilotCtx; children: React.ReactNode }){
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePilot(){
  const v = useContext(Ctx);
  if (!v) throw new Error('usePilot must be used within PilotProvider');
  return v;
}
