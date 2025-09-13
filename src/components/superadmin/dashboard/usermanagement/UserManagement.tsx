import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import styles from './UserManagement.module.css';

// Sortable column keys
export type SortKey = 'name' | 'role' | 'status' | 'joined';
type CoreUserRole = 'User' | 'Operator';
type PilotRole = 'Pilot (Tandem)' | 'Pilot (Solo)';
type SystemRole = 'Superadmin';
type AnyRole = CoreUserRole | PilotRole | SystemRole;
type UserStatus = 'Active' | 'Inactive' | 'Pending' | 'Rejected';

const STATUS_ORDER: UserStatus[] = ['Active','Inactive','Pending','Rejected'];
const ROLE_ORDER: AnyRole[] = ['Superadmin','Pilot (Tandem)','Pilot (Solo)','Operator','User'];

// Types
interface User {
  id: number;
  name: string;
  email: string;
  role: AnyRole; // consolidated strict role type
  status: UserStatus;
  joined: string; // ISO or YYYY-MM-DD
  phone?: string;
  location?: string;
  about?: string;
  rating?: number; // Only for pilots
  blocked?: boolean;
  // Pilot metadata (subset mimicking registration forms)
  pilot_kind?: 'tandem' | 'solo';
  pilot_type?: string; // solo sub-type (acro/xc/...)
  experience_years?: number;
  flights_count?: number;
  wing_models?: string[];
  harness_models?: string[];
  reserve_models?: string[];
  passenger_harness_models?: string[]; // tandem only
  license_doc_filenames?: string[];
}

// Dummy data (later replace with real fetch)
// NOTE: Replace with server fetched data later
const initialUsers: User[] = [
  { id: 1, name: 'Lipo', email: 'lipo@example.com', role: 'Superadmin', status: 'Active', joined: '2023-01-15', phone: '+995 555 111', location: 'Tbilisi', about: 'Platform owner.' },
  {
    id: 2,
    name: 'Giorgi',
    email: 'giorgi@example.com',
    role: 'Pilot (Tandem)',
    pilot_kind: 'tandem',
    status: 'Active',
    joined: '2023-02-20',
    phone: '+995 555 222',
    location: 'Kutaisi',
    about: 'Tandem pilot with 5 years experience.',
    rating: 4.6,
    experience_years: 5,
    flights_count: 780,
    wing_models: ['Ozone Swift 5', 'Nova Mentor 7'],
    harness_models: ['SupAir Evo Lite'],
    reserve_models: ['Gin Yeti'],
    passenger_harness_models: ['Advance BiPro3'],
    license_doc_filenames: ['tandem_cert_2023.pdf']
  },
  { id: 3, name: 'Ana', email: 'ana@example.com', role: 'User', status: 'Inactive', joined: '2023-03-10', phone: '+995 555 333', location: 'Batumi', about: 'Outdoor enthusiast.' },
  {
    id: 4,
    name: 'Sandro',
    email: 'sandro@example.com',
    role: 'Pilot (Solo)',
    pilot_kind: 'solo',
    pilot_type: 'acro',
    status: 'Pending',
    joined: '2023-04-05',
    phone: '+995 555 444',
    location: 'Gudauri',
    about: 'Solo pilot applicant.',
    rating: 0,
    experience_years: 1,
    flights_count: 55,
    wing_models: ['BGD Epic'],
    harness_models: ['Woody Valley Wani2'],
    reserve_models: ['Independence Ultra Cross'],
    license_doc_filenames: ['solo_training_card.jpg']
  },
  { id: 5, name: 'Nino', email: 'nino@example.com', role: 'User', status: 'Active', joined: '2023-05-21', phone: '+995 555 555', location: 'Tbilisi', about: 'Traveler & photographer.' },
  { id: 6, name: 'Mariam', email: 'mariam@example.com', role: 'User', status: 'Active', joined: '2023-06-11', phone: '+995 555 777', location: 'Rustavi', about: 'Loves paragliding.' },
  {
    id: 7,
    name: 'Dato',
    email: 'dato@example.com',
    role: 'Pilot (Tandem)',
    pilot_kind: 'tandem',
    status: 'Active',
    joined: '2023-07-02',
    phone: '+995 555 888',
    location: 'Kazbegi',
    about: 'Mountain flights specialist.',
    rating: 4.9,
    experience_years: 8,
    flights_count: 1120,
    wing_models: ['Gin Fuse 3'],
    harness_models: ['Skywalk Cruise'],
    reserve_models: ['Sky Paragliders Metis'],
    passenger_harness_models: ['Woody Valley X-Rated'],
    license_doc_filenames: ['fuse_license.pdf']
  },
];

const UserManagement: React.FC = () => {
  // ---------------- State ----------------
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('joined');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<User>>({});
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  // Confirmation modal state
  const [confirmState, setConfirmState] = useState<{ open: boolean; message: string; onConfirm: (() => void) | null }>({ open: false, message: '', onConfirm: null });

  // For animated expand height
  const expandRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [animatingId, setAnimatingId] = useState<number | null>(null);

  // ---------------- Derived Data ----------------

  // Derived data
  const filteredUsers = useMemo(() => {
    const raw = search.trim().toLowerCase();
    const tokens = raw.length ? raw.split(/\s+/).filter(Boolean) : [];

    const buildIndex = (u: User): string => {
      const parts: (string | undefined | null | number)[] = [
        u.name,
        u.email,
        u.role,
        u.location,
        u.phone,
        u.about,
        u.pilot_kind,
        u.pilot_type,
        u.experience_years,
        u.flights_count,
        u.rating,
        u.joined,
        u.status,
        ...(u.wing_models || []),
        ...(u.harness_models || []),
        ...(u.reserve_models || []),
        ...(u.passenger_harness_models || []),
        ...(u.license_doc_filenames || [])
      ];
      return parts
        .filter(v => v !== undefined && v !== null && v !== '')
        .map(v => String(v).toLowerCase())
        .join(' | ');
    };

    // Precompute indexes once per users change
    const indexes = new Map<number, string>();
    users.forEach(u => indexes.set(u.id, buildIndex(u)));

    const list = users.filter(u => {
      if (roleFilter && !u.role.toLowerCase().includes(roleFilter)) return false;
      if (statusFilter && u.status.toLowerCase() !== statusFilter) return false;
      if (!tokens.length) return true;
      const idx = indexes.get(u.id)!;
      // Every token must appear
      for (const t of tokens) {
        if (!idx.includes(t)) return false;
      }
      return true;
    });

    const sorted = [...list].sort((a,b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortKey === 'joined') {
        return (new Date(a.joined).getTime() - new Date(b.joined).getTime()) * dir;
      }
      if (sortKey === 'status') {
        return (STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)) * dir;
      }
      if (sortKey === 'role') {
        return (ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)) * dir;
      }
      return a.name.localeCompare(b.name) * dir;
    });
    return sorted;
  }, [users, search, roleFilter, statusFilter, sortKey, sortDir]);

  const total = users.length;
  const pending = users.filter(u => u.status === 'Pending').length; // now only pilots can be pending
  const active = users.filter(u => u.status === 'Active').length;

  const handleSort = useCallback((nextKey: SortKey) => {
    setSortKey(prev => {
      if (prev === nextKey) {
        setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        return prev;
      }
      setSortDir('asc');
      return nextKey;
    });
  }, []);

  const sortIndicator = (k: SortKey) => (
    <span className={styles.sortIndicator} aria-hidden="true">
      {k !== sortKey ? '↕' : (sortDir === 'asc' ? '▲' : '▼')}
    </span>
  );

  const toggleExpand = useCallback((id: number) => {
    setAnimatingId(id);
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  const toggleBlock = useCallback((id: number) => {
    setUsers(us => us.map(u => u.id === id ? ({ ...u, blocked: !u.blocked, status: !u.blocked ? 'Inactive' : 'Active' }) : u));
  }, []);

  // delete user (placed after cancelEdit declaration for dependency order)
  const deleteUserRef = useRef<(id:number)=>void>();
  deleteUserRef.current = (id:number) => {
    setUsers(us => us.filter(u => u.id !== id));
    setExpandedId(prev => prev === id ? null : prev);
    if (editId === id) cancelEdit();
  };

  const approvePilot = useCallback((id: number) => {
    setUsers(us => us.map(u => u.id === id ? ({ ...u, status: 'Active' }) : u));
    setExpandedId(id);
  }, []);

  const rejectPilot = useCallback((id: number) => {
    setUsers(us => us.map(u => u.id === id ? ({ ...u, status: 'Rejected' }) : u));
    setExpandedId(id);
    if (editId === id) cancelEdit();
  }, [editId]);

  const toggleUserOperator = useCallback((id: number) => {
    setUsers(us => us.map(u => {
      if (u.id !== id) return u;
      if (u.role === 'User') return { ...u, role: 'Operator' };
      if (u.role === 'Operator') return { ...u, role: 'User' };
      return u;
    }));
  }, []);

  const startEdit = useCallback((u: User) => {
    setEditId(u.id);
    setEditDraft({ ...u });
    setExpandedId(u.id);
  }, []);

  const cancelEdit = useCallback(() => { setEditId(null); setEditDraft({}); }, []);

  const saveEdit = useCallback(() => {
    if (editId == null) return;
    setUsers(us => us.map(u => u.id === editId ? ({ ...u, ...editDraft }) : u));
    setEditId(null); setEditDraft({});
  }, [editId, editDraft]);

  // --------------- Confirmation Helpers ---------------
  const openConfirm = useCallback((message: string, action: () => void) => {
    setConfirmState({ open: true, message, onConfirm: () => { action(); } });
  }, []);

  const closeConfirm = useCallback(() => setConfirmState(cs => ({ ...cs, open: false })), []);
  const proceedConfirm = useCallback(() => {
    if (confirmState.onConfirm) confirmState.onConfirm();
    closeConfirm();
  }, [confirmState, closeConfirm]);

  // ESC key closes confirm
  useEffect(() => {
    if (!confirmState.open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeConfirm(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmState.open, closeConfirm]);

  // Smooth expand / collapse height animation
  useEffect(() => {
    if (animatingId == null) return;
    const el = expandRefs.current[animatingId];
    if (!el) return;
    const wrapper = el;
    // measure
    wrapper.style.height = 'auto';
    const target = wrapper.getBoundingClientRect().height;
    wrapper.style.height = '0px';
    requestAnimationFrame(() => {
      wrapper.style.transition = 'height .28s ease';
      wrapper.style.height = target + 'px';
    });
    const end = () => {
      wrapper.style.height = 'auto';
      wrapper.style.transition = '';
      setAnimatingId(null);
      wrapper.removeEventListener('transitionend', end);
    };
    wrapper.addEventListener('transitionend', end);
  }, [animatingId, expandedId]);

  const renderDetails = (u: User) => {
    const isEditing = editId === u.id;
    const isPilot = u.role.toLowerCase().includes('pilot');
  const pendingPilot = isPilot && u.status === 'Pending';
    const rejectedPilot = isPilot && u.status === 'Rejected';
    const tandem = u.pilot_kind === 'tandem' || u.role.toLowerCase().includes('tandem');
  const isUserType = (u.role === 'User' || u.role === 'Operator');
    return (
      <div className={styles.detailsPanel}>
        {!isEditing && (
          <div className={styles.detailsGrid}>
            <div><span className={styles.detailLabel}>Email:</span> {u.email}</div>
            <div><span className={styles.detailLabel}>Phone:</span> {u.phone || '—'}</div>
            <div><span className={styles.detailLabel}>Location:</span> {u.location || '—'}</div>
            <div><span className={styles.detailLabel}>Joined:</span> {u.joined}</div>
            {isPilot && <div><span className={styles.detailLabel}>Rating:</span> {u.rating != null ? u.rating.toFixed(1) : 'N/A'}</div>}
            <div className={styles.detailAbout}><span className={styles.detailLabel}>About:</span><p>{u.about || 'No bio provided.'}</p></div>
            {isPilot && (
              <div className={styles.pilotMetaBlock}>
                <span className={styles.detailLabel}>Pilot Kind:</span> {tandem ? 'Tandem' : 'Solo'}{u.pilot_type ? ` / ${u.pilot_type}` : ''}
              </div>
            )}
            {isPilot && (
              <div className={styles.pilotMetaGrid}>
                <div><span className={styles.detailLabel}>Experience (yrs):</span> {u.experience_years ?? '—'}</div>
                <div><span className={styles.detailLabel}>Flights:</span> {u.flights_count ?? '—'}</div>
                {tandem && <div><span className={styles.detailLabel}>Passenger Harnesses:</span> {(u.passenger_harness_models?.length ? u.passenger_harness_models.join(', ') : '—')}</div>}
                {u.license_doc_filenames && <div><span className={styles.detailLabel}>Licenses:</span> {u.license_doc_filenames.join(', ')}</div>}
              </div>
            )}
            {isPilot && (
              <div className={styles.gearSection}>
                <div className={styles.sectionTitle}>Equipment</div>
                <div className={styles.gearLists}>
                  <div>
                    <div className={styles.gearLabel}>Wings</div>
                    <div className={styles.gearList}>{(u.wing_models || []).length ? u.wing_models!.map(w => <span key={w} className={styles.gearChip}>{w}</span>) : <span className={styles.emptyGear}>—</span>}</div>
                  </div>
                  <div>
                    <div className={styles.gearLabel}>Harness</div>
                    <div className={styles.gearList}>{(u.harness_models || []).length ? u.harness_models!.map(w => <span key={w} className={styles.gearChip}>{w}</span>) : <span className={styles.emptyGear}>—</span>}</div>
                  </div>
                  <div>
                    <div className={styles.gearLabel}>Reserve</div>
                    <div className={styles.gearList}>{(u.reserve_models || []).length ? u.reserve_models!.map(w => <span key={w} className={styles.gearChip}>{w}</span>) : <span className={styles.emptyGear}>—</span>}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {isEditing && !pendingPilot && !rejectedPilot && (
          <form className={styles.editForm} onSubmit={e => { e.preventDefault(); saveEdit(); }}>
            <div className={styles.formRow}>
              <label>Name<input value={editDraft.name || ''} onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))} /></label>
              <label>Email<input value={editDraft.email || ''} onChange={e => setEditDraft(d => ({ ...d, email: e.target.value }))} /></label>
            </div>
            <div className={styles.formRow}>
              <label>Phone<input value={editDraft.phone || ''} onChange={e => setEditDraft(d => ({ ...d, phone: e.target.value }))} /></label>
              <label>Location<input value={editDraft.location || ''} onChange={e => setEditDraft(d => ({ ...d, location: e.target.value }))} /></label>
            </div>
            {isPilot && (
              <div className={styles.formRow}>
                <label>Rating
                  <input type="range" min={0} max={5} step={0.1} value={editDraft.rating ?? 0} onChange={e => setEditDraft(d => ({ ...d, rating: parseFloat(e.target.value) }))} />
                  <span className={styles.rangeValue}>{(editDraft.rating ?? 0).toFixed(1)}</span>
                </label>
              </div>
            )}
            <div className={styles.formRow}>
              <label className={styles.fullWidth}>About
                <textarea rows={3} value={editDraft.about || ''} onChange={e => setEditDraft(d => ({ ...d, about: e.target.value }))} />
              </label>
            </div>
            <div className={styles.editActions}>
              <button type="button" onClick={cancelEdit} className={styles.secondaryBtn}>Cancel</button>
              <button type="submit" className={styles.primaryBtn}>Save</button>
            </div>
          </form>
        )}
        <div className={styles.detailActions}>
          {pendingPilot && (
            <>
              <button type="button" onClick={() => openConfirm(`Approve pilot ${u.name}?`, () => approvePilot(u.id))} className={styles.approveBtn}>Approve</button>
              <button type="button" onClick={() => openConfirm(`Reject pilot ${u.name}?`, () => rejectPilot(u.id))} className={styles.rejectBtn}>Reject</button>
            </>
          )}
          {rejectedPilot && (
            <span className={styles.rejectedNote}>Rejected pilot — no edits allowed.</span>
          )}
          {isUserType && <button type="button" onClick={() => openConfirm(`${u.role === 'User' ? 'Make' : 'Revert'} ${u.name} ${u.role === 'User' ? 'Operator' : 'User'}?`, () => toggleUserOperator(u.id))} className={styles.secondaryBtn}>Role: {u.role === 'User' ? 'Make Operator' : 'Make User'}</button>}
          {!pendingPilot && !rejectedPilot && editId !== u.id && !isUserType && <button onClick={() => startEdit(u)} className={styles.primaryBtn}>Edit</button>}
          {!pendingPilot && !rejectedPilot && editId === u.id && <button onClick={() => openConfirm(`Save changes to ${u.name}?`, () => saveEdit())} className={styles.primaryBtn}>Save</button>}
          {!pendingPilot && !rejectedPilot && editId === u.id && <button onClick={() => openConfirm('Discard changes?', () => cancelEdit())} className={styles.secondaryBtn}>Cancel</button>}
          {!pendingPilot && <button onClick={() => openConfirm(`${u.blocked ? 'Unblock' : 'Block'} ${u.name}?`, () => toggleBlock(u.id))} className={u.blocked ? styles.unblockBtn : styles.blockBtn}>{u.blocked ? 'Unblock' : 'Block'}</button>}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}><h2 className={styles.title}>User Management</h2></div>
      <div className={styles.summaryBar}>
        <div className={styles.summaryItem}><span className={styles.summaryLabel}>Total</span><span className={styles.summaryValue}>{total}</span></div>
        <div className={styles.summaryItem}><span className={styles.summaryLabel}>Active</span><span className={styles.summaryValue}>{active}</span></div>
        <div className={styles.summaryItem}><span className={styles.summaryLabel}>Pending</span><span className={styles.summaryValue}>{pending}</span></div>
        <div className={styles.summaryItem}><span className={styles.summaryLabel}>Showing</span><span className={styles.summaryValue}>{filteredUsers.length}</span></div>
      </div>
      <div className={styles.mobileFiltersBar}>
        <button
          type="button"
          className={styles.mobileFiltersToggle}
          onClick={() => setMobileFiltersOpen(o => !o)}
          aria-expanded={mobileFiltersOpen}
        >
          {mobileFiltersOpen ? 'Hide Filters' : 'Filters'}
          {(roleFilter || statusFilter || search) && (
            <span className={styles.filterCountBadge}>{[roleFilter,statusFilter,search].filter(Boolean).length}</span>
          )}
        </button>
      </div>
      <form className={`${styles.filters} ${styles.responsiveFilters} ${mobileFiltersOpen ? styles.open : styles.closed}`} onSubmit={e => e.preventDefault()}>
        <div className={styles.searchWrapper}>
          <input className={styles.searchInput} placeholder="Search name, email, role..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button type="button" onClick={() => setSearch('')} className={styles.clearBtn}>✕</button>}
        </div>
        <select className={styles.filterSelect} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="superadmin">Superadmin</option>
          <option value="pilot (tandem)">Pilot (Tandem)</option>
          <option value="pilot (solo)">Pilot (Solo)</option>
          <option value="user">User</option>
          <option value="operator">Operator</option>
        </select>
        <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Any Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </form>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th onClick={() => handleSort('name')}>Name {sortIndicator('name')}</th>
              <th>Role {sortIndicator('role')}</th>
              <th>Status {sortIndicator('status')}</th>
              <th onClick={() => handleSort('joined')}>Joined {sortIndicator('joined')}</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <React.Fragment key={u.id}>
                <tr className={styles.row} data-expanded={expandedId === u.id || undefined} onClick={(e) => { if ((e.target as HTMLElement).closest('button')) return; toggleExpand(u.id); }}>
                  <td>
                    <div className={`${styles.userCell} ${expandedId === u.id ? styles.userCellExpanded : ''}`}>
                      <button
                        type="button"
                        aria-label={expandedId === u.id ? 'Collapse row' : 'Expand row'}
                        className={`${styles.expandToggle} ${expandedId === u.id ? styles.expanded : ''}`}
                        onClick={(e) => { e.stopPropagation(); toggleExpand(u.id); }}
                      >
                        <span className={styles.chevron}></span>
                      </button>
                      <div className={styles.avatar}>{u.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <div className={styles.userName}>{u.name}
                          {u.role === 'Operator' && <span className={styles.badgeOperator}>OPERATOR</span>}
                          {u.blocked && <span className={styles.badgeBlocked}>BLOCKED</span>}
                        </div>
                        <div className={styles.userEmail}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{u.role}</td>
                  <td><span className={`${styles.status} ${styles[u.status.toLowerCase()]}`}><span className={styles.statusDot} aria-hidden="true"></span>{u.status}</span></td>
                  <td>{u.joined}</td>
                  <td className={styles.actions}>
                    {u.status === 'Pending' && u.role.toLowerCase().includes('pilot') && (
                      <>
                        <button className={styles.actionButton} onClick={(e) => { e.stopPropagation(); openConfirm(`Approve pilot ${u.name}?`, () => approvePilot(u.id)); }}>Approve</button>
                        <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={(e) => { e.stopPropagation(); openConfirm(`Reject pilot ${u.name}?`, () => rejectPilot(u.id)); }}>Reject</button>
                      </>
                    )}
                    {u.status !== 'Pending' && u.status !== 'Rejected' && (
                      <>
                        { (u.role === 'User' || u.role === 'Operator') && (
                          <button className={styles.actionButton} onClick={(e) => { e.stopPropagation(); openConfirm(`${u.role === 'User' ? 'Make' : 'Revert'} ${u.name} ${u.role === 'User' ? 'Operator' : 'User'}?`, () => toggleUserOperator(u.id)); }}>{u.role === 'User' ? 'Make Operator' : 'Make User'}</button>
                        )}
                        { !(u.role === 'User' || u.role === 'Operator') && (
                          <button className={styles.actionButton} onClick={(e) => { e.stopPropagation(); startEdit(u); }}>Edit</button>
                        )}
                        <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={(e) => { e.stopPropagation(); openConfirm(`Delete user ${u.name}? This cannot be undone.`, () => deleteUserRef.current && deleteUserRef.current(u.id)); }}>Delete</button>
                        <button className={styles.actionButton} onClick={(e) => { e.stopPropagation(); openConfirm(`${u.blocked ? 'Unblock' : 'Block'} ${u.name}?`, () => toggleBlock(u.id)); }}>{u.blocked ? 'Unblock' : 'Block'}</button>
                      </>
                    )}
                    {u.status === 'Rejected' && (
                      <span className={styles.rejectedTag}>Rejected</span>
                    )}
                  </td>
                </tr>
                {expandedId === u.id && (
                  <tr className={styles.expandRow}>
                    <td colSpan={5}>
                      <div ref={r => { expandRefs.current[u.id] = r; }} className={styles.expandAnimWrapper}>
                        {renderDetails(u)}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {!filteredUsers.length && (
              <tr><td colSpan={5} className={styles.noResults}>No users match current filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.mobileList}>
        {filteredUsers.map(u => (
          <div key={u.id} className={styles.userCard}>
            <div className={styles.cardHeader} onClick={() => toggleExpand(u.id)}>
              <div className={styles.avatarLg}>{u.name.charAt(0).toUpperCase()}</div>
              <div className={styles.cardHeaderInfo}>
                <div className={styles.cardName}>{u.name}{u.blocked && <span className={styles.badgeBlocked}>BLOCKED</span>}</div>
                <div className={styles.cardEmail}>{u.email}</div>
                <div className={styles.cardMetaSmall}>{u.role}</div>
              </div>
              <span className={`${styles.status} ${styles[u.status.toLowerCase()]}`}><span className={styles.statusDot} aria-hidden="true"></span>{u.status}</span>
            </div>
            {expandedId === u.id && (
              <div className={styles.mobileDetails}>{renderDetails(u)}</div>
            )}
          </div>
        ))}
      </div>
      {confirmState.open && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalBody}>{confirmState.message}</div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.secondaryBtn} onClick={closeConfirm}>Cancel</button>
              <button type="button" className={styles.primaryBtn} onClick={proceedConfirm}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
