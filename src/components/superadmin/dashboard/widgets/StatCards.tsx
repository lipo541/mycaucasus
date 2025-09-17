import React, { useState, useEffect } from 'react';
import styles from './StatCards.module.css';

// --- Stat Card Component and Icons ---
type StatCardProps = {
	title: string;
	value: string | number;
	icon: React.ReactNode;
	change?: string;
	changeType?: 'positive' | 'negative';
	loading?: boolean;
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, change, changeType, loading }) => {
	return (
		<div className={styles.card} role="figure" aria-labelledby={`${title}-label`} tabIndex={0}>
			<div className={styles.cardHeader}>
				<div className={styles.cardIcon} aria-hidden>{icon}</div>
				<div className={styles.cardTitleRow}>
					<p id={`${title}-label`} className={styles.cardTitle}>{title}</p>
					<div className={styles.cardValueWrap}>
						{loading ? (
							<div className={styles.skeleton} style={{width:'70px', height:'28px'}} aria-hidden />
						) : (
							<span className={styles.cardValue}>{value}</span>
						)}
						{change && !loading && (
							<span className={`${styles.cardChange} ${changeType === 'positive' ? styles.positive : styles.negative}`}>
								<span className={changeType === 'positive' ? styles.trendUp : styles.trendDown} aria-hidden />
								{change}
							</span>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

const UsersIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
		<circle cx="9" cy="7" r="4" />
		<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
		<path d="M16 3.13a4 4 0 0 1 0 7.75" />
	</svg>
);
const PilotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
);
// Tandem Pilots Icon - two people connected for tandem flight
const TandemPilotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7" cy="8" r="3" />
        <circle cx="17" cy="8" r="3" />
        <path d="M4 18v-1a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v1" />
        <path d="M14 18v-1a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v1" />
        <path d="M10 12h4" strokeWidth="3" strokeLinecap="round"/>
    </svg>
);
// Solo Pilots Icon - single person with wings
const SoloPilotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="3" />
        <path d="M9 18v-1a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3v1" />
        <path d="M4 12l4-2 4 2 4-2 4 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 11v3" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);
const ContentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
);
const SessionsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12h4l3-8 4 16 3-8h4" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="5" r="2" fill="currentColor"/>
    </svg>
);
const LocationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
    </svg>
);
const NewsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2 2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="M10 6h8M10 10h8M10 14h4" strokeLinecap="round"/>
    </svg>
);
const PendingUserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="3" />
        <path d="M9 18v-1a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3v1" />
        <circle cx="18" cy="6" r="4" strokeWidth="1.5"/>
        <path d="M18 4v2l1 1" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);


// --- Chart Component (Placeholder) ---
const Charts = () => (
  <section className={`${styles.panel} ${styles.fullRow}`} aria-labelledby="registrations-header">
    <h3 id="registrations-header" className={styles.panelHeader}>User Registrations (Last 30 Days)</h3>
    <div className={styles.chartPlaceholder}>Chart will be rendered here</div>
  </section>
);

// --- Recent Activity Component ---
const RecentActivity = () => {
	const activities = [
		{ user: 'Lipo', action: 'registered.', time: '2 hours ago', avatar: 'L' },
		{ user: 'Giorgi', action: 'posted a new photo.', time: '5 hours ago', avatar: 'G' },
		{ user: 'Ana', action: 'reported a comment.', time: '1 day ago', avatar: 'A' },
		{ user: 'Sandro', action: 'registered.', time: '2 days ago', avatar: 'S' },
	];

	return (
    <section className={`${styles.panel} ${styles.fullRow}`} aria-labelledby="recent-activity-header">
      <h3 id="recent-activity-header" className={styles.panelHeader}>Recent Activity</h3>
      <ul className={styles.activityList}>
        {activities.map((activity, index) => (
          <li key={index} className={styles.activityItem}>
            <div className={styles.activityAvatar} aria-hidden>{activity.avatar}</div>
            <div>
              <p className={styles.activityText}>
                <strong>{activity.user}</strong> {activity.action}
              </p>
              <p className={styles.activityTime}>{activity.time}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
	);
};


// --- Main Component Renamed to DashboardWidgets ---
const DashboardWidgets = () => {
	const [loading, setLoading] = useState(true);
	const [stats, setStats] = useState<Array<StatCardProps>>([]);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		async function load() {
			try {
				const res = await fetch('/api/admin/stats', { cache: 'no-store' });
				if (!res.ok) throw new Error('Request failed');
				const data = await res.json();
				if (!data.ok) throw new Error(data.error || 'Bad response');
				if (cancelled) return;
				const s = data.stats;
				setStats([
					{ title: 'Total Users', value: s.totalUsers, icon: <UsersIcon />, change: '+0%', changeType: 'positive' },
					{ title: 'Tandem Pilots', value: s.tandemPilots, icon: <TandemPilotIcon />, change: '+0', changeType: 'positive' },
					{ title: 'Solo Pilots', value: s.soloPilots, icon: <SoloPilotIcon />, change: '+0', changeType: 'positive' },
					{ title: 'Pending Users', value: s.pendingUsers, icon: <PendingUserIcon />, change: s.pendingUsers.toString(), changeType: 'positive' },
					{ title: 'Pending Content', value: s.pendingContent, icon: <ContentIcon />, change: s.pendingContent.toString(), changeType: s.pendingContent > 0 ? 'negative' : 'positive' },
					{ title: 'Active Sessions', value: s.activeSessions, icon: <SessionsIcon />, change: '+0%', changeType: 'positive' },
					{ title: 'Total Locations', value: s.totalLocations, icon: <LocationIcon />, change: '+0', changeType: 'positive' },
					{ title: 'Total News', value: s.totalNews, icon: <NewsIcon />, change: '+0', changeType: 'positive' }
				]);
			} catch (e) {
				console.warn('[DashboardWidgets] stats fetch failed, using fallback', (e as Error).message);
				if (!cancelled) {
					setError('Failed loading live stats');
					// fallback static placeholder
					setStats([
						{ title: 'Total Users', value: 0, icon: <UsersIcon /> },
						{ title: 'Tandem Pilots', value: 0, icon: <TandemPilotIcon /> },
						{ title: 'Solo Pilots', value: 0, icon: <SoloPilotIcon /> },
						{ title: 'Pending Users', value: 0, icon: <PendingUserIcon /> },
						{ title: 'Pending Content', value: 0, icon: <ContentIcon /> },
						{ title: 'Active Sessions', value: 0, icon: <SessionsIcon /> },
						{ title: 'Total Locations', value: 0, icon: <LocationIcon /> },
						{ title: 'Total News', value: 0, icon: <NewsIcon /> }
					]);
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		load();
		return () => { cancelled = true; };
	}, []);

	const skeletonStats: StatCardProps[] = new Array(8).fill(null).map((_, i) => ({
		title: `Loading-${i}`,
		value: 0,
		icon: <div className={styles.skeleton} style={{width:24,height:24,borderRadius:6}} aria-hidden />,
		loading: true
	}));

	const list = loading ? skeletonStats : stats;

	return (
		<div className={styles.dashboardGrid} aria-live="polite">
			{error && <div style={{gridColumn:'1/-1', color:'#f87171', fontSize:'.75rem'}}>⚠ {error} (using fallback)</div>}
			<div className={styles.cardsContainer}>
				{list.map(stat => (
					<StatCard key={stat.title} {...stat} />
				))}
			</div>
			<Charts />
			<RecentActivity />
		</div>
	);
};

export default DashboardWidgets;
