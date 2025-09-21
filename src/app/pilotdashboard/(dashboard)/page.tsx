import React from 'react';
import PilotDashboard from '@/components/Pilotdashboard/pilotdashboard';

export default async function PilotDashboardPage(){
  // Layout provides PilotProvider; render client component directly.
  return <PilotDashboard />;
}
