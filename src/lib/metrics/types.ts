export interface VisitPoint { date: string; visits: number; unique: number; }
export interface VisitSeriesRange { from: string; to: string; days: number; }
export interface VisitSeriesTotals { visits: number; unique: number; }
export interface VisitSeries { range: VisitSeriesRange; points: VisitPoint[]; totals: VisitSeriesTotals; }

export interface VisitLogPayload { path: string; ref?: string; ts?: number; }
export interface VisitLogStored extends VisitLogPayload { session_id: string; user_id?: string | null; }
