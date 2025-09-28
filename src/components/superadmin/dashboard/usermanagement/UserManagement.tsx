import { toast } from "@/lib/toast";
import Image from "next/image";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./UserManagement.module.css";

// Lightweight thumbnail grid for document previews with signed URLs
type DocThumbsProps = {
  paths: string[];
  onOpen: (index: number) => void;
};

const DocThumbs: React.FC<DocThumbsProps> = ({ paths, onOpen }) => {
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!paths?.length) {
        setThumbs([]);
        return;
      }
      setLoading(true);
      try {
        // Fetch signed URLs for up to 4 previews to reduce API churn
        const limit = Math.min(paths.length, 4);
        const urls: string[] = [];
        for (let i = 0; i < limit; i++) {
          try {
            const res = await fetch("/api/register/pilot-basic", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "sign-doc",
                path: paths[i],
                expires: 600,
              }),
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok && json?.url) urls.push(String(json.url));
            else urls.push("");
          } catch {
            urls.push("");
          }
        }
        if (!cancelled) setThumbs(urls);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [paths]);

  if (!paths?.length) return <div className={styles.emptyGear}>—</div>;

  return (
    <div className={styles.thumbGrid} aria-busy={loading || undefined}>
      {thumbs.map((u, i) => (
        <div key={i} className={styles.thumb}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {u ? (
            <img
              src={u}
              alt={`Document ${i + 1}`}
              className={styles.thumbImg}
            />
          ) : (
            <div className={styles.thumbEmpty}>No preview</div>
          )}
          <button
            type="button"
            className={styles.thumbOpenBtn}
            onClick={() => onOpen(i)}
          >
            Open #{i + 1}
          </button>
        </div>
      ))}
      {paths.length > thumbs.length && (
        <button
          type="button"
          className={styles.thumbOpenBtn}
          onClick={() => onOpen(thumbs.length)}
        >
          Open #{thumbs.length + 1}
        </button>
      )}
    </div>
  );
};

// Sortable column keys
export type SortKey = "name" | "role" | "status" | "joined";
type CoreUserRole = "User" | "Operator";
type PilotRole = "Pilot (Tandem)" | "Pilot (Solo)";
type SystemRole = "Superadmin";
type AnyRole = CoreUserRole | PilotRole | SystemRole;
type UserStatus = "Active" | "Inactive" | "Pending" | "Rejected";

const STATUS_ORDER: UserStatus[] = [
  "Active",
  "Inactive",
  "Pending",
  "Rejected",
];
const ROLE_ORDER: AnyRole[] = [
  "Superadmin",
  "Pilot (Tandem)",
  "Pilot (Solo)",
  "Operator",
  "User",
];

// Types
interface User {
  id: string; // Supabase user id (UUID)
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
  pilot_kind?: "tandem" | "solo";
  pilot_type?: string; // solo sub-type (acro/xc/...)
  experience_years?: number;
  flights_count?: number;
  wing_models?: string[];
  harness_models?: string[];
  reserve_models?: string[];
  passenger_harness_models?: string[]; // tandem only
  license_doc_filenames?: string[];
  license_doc_paths?: string[];
  avatar_storage_path?: string | null;
  avatar_url?: string | null;
  avatar_signed_url?: string | null;
  // New richer pilot meta (from updated registration)
  first_name?: string;
  last_name?: string;
  full_name?: string;
  gender?: "male" | "female" | "other" | string;
  date_of_birth?: string; // YYYY-MM-DD
  accepted_terms?: boolean;
  email_verified?: boolean;
  phone_verified?: boolean;
  // Tandem specific equipment models
  wing_model?: string; // singular convenience
  harness_model?: string;
  reserve_model?: string;
  passenger_harness_model?: string;
  // Uploaded document paths per category
  wing_serial_doc_paths?: string[];
  harness_serial_doc_paths?: string[];
  passenger_harness_serial_doc_paths?: string[];
  tandem_certificate_doc_paths?: string[];
  reserve_packing_certificate_paths?: string[];
  has_tandem_certificate?: boolean;
  tandem_certificate_status?: "approved" | "rejected" | "pending" | "missing";
}
// Initial empty state; will load from API
const initialUsers: User[] = [];

const UserManagement: React.FC = () => {
  // ---------------- State ----------------
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Fullscreen image viewer (for avatar)
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  // Reject modal state
  const [rejectUserId, setRejectUserId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  // Send message modal state
  const [msgUserId, setMsgUserId] = useState<string | null>(null);
  const [msgText, setMsgText] = useState<string>("");
  const [msgSubmitting, setMsgSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("joined");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<User>>({});
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  // Confirmation modal state
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    message: string;
    onConfirm: (() => void) | null;
  }>({ open: false, message: "", onConfirm: null });
  // Global message state
  const [globalOpen, setGlobalOpen] = useState(false);
  const [globalText, setGlobalText] = useState("");
  const [globalSubmitting, setGlobalSubmitting] = useState(false);
  const [globalAudience, setGlobalAudience] = useState<
    "everyone" | "users" | "pilots" | "solo" | "tandem"
  >("everyone");

  // For animated expand height
  const expandRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [animatingId, setAnimatingId] = useState<string | null>(null);

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
        ...(u.license_doc_filenames || []),
        // also index singular model fields so searches work even if arrays are empty
        u.wing_model,
        u.harness_model,
        u.reserve_model,
        u.passenger_harness_model,
      ];
      return parts
        .filter((v) => v !== undefined && v !== null && v !== "")
        .map((v) => String(v).toLowerCase())
        .join(" | ");
    };

    // Precompute indexes once per users change
    const indexes = new Map<string, string>();
    users.forEach((u) => indexes.set(u.id, buildIndex(u)));

    const list = users.filter((u) => {
      if (roleFilter && !u.role.toLowerCase().includes(roleFilter))
        return false;
      if (statusFilter && u.status.toLowerCase() !== statusFilter) return false;
      if (!tokens.length) return true;
      const idx = indexes.get(u.id)!;
      // Every token must appear
      for (const t of tokens) {
        if (!idx.includes(t)) return false;
      }
      return true;
    });

    const sorted = [...list].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "joined") {
        return (
          (new Date(a.joined).getTime() - new Date(b.joined).getTime()) * dir
        );
      }
      if (sortKey === "status") {
        return (
          (STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)) *
          dir
        );
      }
      if (sortKey === "role") {
        return (ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)) * dir;
      }
      return a.name.localeCompare(b.name) * dir;
    });
    return sorted;
  }, [users, search, roleFilter, statusFilter, sortKey, sortDir]);

  const total = users.length;
  const pending = users.filter((u) => u.status === "Pending").length; // now only pilots can be pending
  const active = users.filter((u) => u.status === "Active").length;

  const handleSort = useCallback((nextKey: SortKey) => {
    setSortKey((prev) => {
      if (prev === nextKey) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir("asc");
      return nextKey;
    });
  }, []);

  const sortIndicator = (k: SortKey) => (
    <span className={styles.sortIndicator} aria-hidden="true">
      {k !== sortKey ? "↕" : sortDir === "asc" ? "▲" : "▼"}
    </span>
  );

  const toggleExpand = useCallback((id: string) => {
    setAnimatingId(id);
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const toggleBlock = useCallback((id: string) => {
    setUsers((us) =>
      us.map((u) =>
        u.id === id
          ? {
              ...u,
              blocked: !u.blocked,
              status: !u.blocked ? "Inactive" : "Active",
            }
          : u
      )
    );
  }, []);

  // cancel edit must be declared before any callbacks that reference it in deps
  const cancelEdit = useCallback(() => {
    setEditId(null as any);
    setEditDraft({});
  }, []);

  // delete user (placed after cancelEdit declaration for dependency order)
  const deleteUserRef = useRef<(id: string) => void>();
  deleteUserRef.current = (id: string) => {
    setUsers((us) => us.filter((u) => u.id !== id));
    setExpandedId((prev) => (prev === id ? null : prev));
    if (editId === id) cancelEdit();
  };

  const approvePilot = useCallback((id: string) => {
    setUsers((us) =>
      us.map((u) => (u.id === id ? { ...u, status: "Active" } : u))
    );
    setExpandedId(id);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rejectPilot = useCallback(
    (id: string) => {
      setUsers((us) =>
        us.map((u) => (u.id === id ? { ...u, status: "Rejected" } : u))
      );
      setExpandedId(id);
      if (editId === id) cancelEdit();
    },
    [editId, cancelEdit]
  );

  const toggleUserOperator = useCallback((id: string) => {
    setUsers((us) =>
      us.map((u) => {
        if (u.id !== id) return u;
        if (u.role === "User") return { ...u, role: "Operator" };
        if (u.role === "Operator") return { ...u, role: "User" };
        return u;
      })
    );
  }, []);

  const startEdit = useCallback((u: User) => {
    setEditId(u.id);
    setEditDraft({ ...u });
    setExpandedId(u.id);
  }, []);

  const saveEdit = useCallback(() => {
    if (editId == null) return;
    setUsers((us) =>
      us.map((u) => (u.id === editId ? { ...u, ...editDraft } : u))
    );
    setEditId(null);
    setEditDraft({});
  }, [editId, editDraft]);

  // --------------- Confirmation Helpers ---------------
  const openConfirm = useCallback((message: string, action: () => void) => {
    setConfirmState({
      open: true,
      message,
      onConfirm: () => {
        action();
      },
    });
  }, []);

  const closeConfirm = useCallback(
    () => setConfirmState((cs) => ({ ...cs, open: false })),
    []
  );
  const proceedConfirm = useCallback(() => {
    if (confirmState.onConfirm) confirmState.onConfirm();
    closeConfirm();
  }, [confirmState, closeConfirm]);

  // Set tandem certificate status (approved/rejected/pending) at top-level to respect Rules of Hooks
  const setTandemCertStatus = useCallback(
    async (userId: string, status: "approved" | "rejected" | "pending") => {
      try {
        const res = await fetch("/api/register/pilot-basic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "set-tandem-certificate-status",
            userId,
            status,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || "Failed to save");
        setUsers((us) =>
          us.map((x) =>
            x.id === userId ? { ...x, tandem_certificate_status: status } : x
          )
        );
        toast.success(
          status === "approved"
            ? "Certificate approved"
            : status === "rejected"
            ? "Certificate rejected"
            : "Certificate set to pending"
        );
      } catch (e: any) {
        toast.error(e?.message || "Failed to update certificate status");
      }
    },
    []
  );

  // ESC key closes confirm
  useEffect(() => {
    if (!confirmState.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmState.open, closeConfirm]);

  // Smooth expand / collapse height animation
  useEffect(() => {
    if (animatingId == null) return;
    const el = expandRefs.current[animatingId];
    if (!el) return;
    const wrapper = el;
    // measure
    wrapper.style.height = "auto";
    const target = wrapper.getBoundingClientRect().height;
    wrapper.style.height = "0px";
    requestAnimationFrame(() => {
      wrapper.style.transition = "height .28s ease";
      wrapper.style.height = target + "px";
    });
    const end = () => {
      wrapper.style.height = "auto";
      wrapper.style.transition = "";
      setAnimatingId(null);
      wrapper.removeEventListener("transitionend", end);
    };
    wrapper.addEventListener("transitionend", end);
  }, [animatingId, expandedId]);

  const renderDetails = (u: User) => {
    const isEditing = editId === u.id;
    const isPilot = u.role.toLowerCase().includes("pilot");
    const pendingPilot = isPilot && u.status === "Pending";
    const rejectedPilot = isPilot && u.status === "Rejected";
    const tandem =
      u.pilot_kind === "tandem" || u.role.toLowerCase().includes("tandem");
    const isUserType = u.role === "User" || u.role === "Operator";
    const openDocFrom = async (
      paths: string[] | undefined | null,
      idx: number
    ) => {
      if (!paths || !paths[idx]) return;
      try {
        const res = await fetch("/api/register/pilot-basic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "sign-doc",
            path: paths[idx],
            expires: 600,
          }),
        });
        if (!res.ok) throw new Error(`Failed to sign URL (${res.status})`);
        const json = await res.json();
        const url = json.url as string;
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      } catch (e) {
        console.error(e);
      }
    };
    return (
      <div className={styles.detailsPanel}>
        {!isEditing && (
          <div className={styles.detailsGrid}>
            <div>
              <span className={styles.detailLabel}>Email:</span> {u.email}
            </div>
            <div>
              <span className={styles.detailLabel}>Phone:</span>{" "}
              {u.phone || "—"}
            </div>
            <div>
              <span className={styles.detailLabel}>Location:</span>{" "}
              {u.location || "—"}
            </div>
            <div>
              <span className={styles.detailLabel}>Joined:</span> {u.joined}
            </div>
            {isPilot && (
              <div>
                <span className={styles.detailLabel}>Rating:</span>{" "}
                {u.rating != null ? u.rating.toFixed(1) : "N/A"}
              </div>
            )}
            <div className={styles.detailAbout}>
              <span className={styles.detailLabel}>About:</span>
              <p>{u.about || "No bio provided."}</p>
            </div>
            {isPilot && (
              <div className={styles.pilotMetaBlock}>
                <span className={styles.detailLabel}>Pilot Kind:</span>{" "}
                {tandem ? "Tandem" : "Solo"}
                {u.pilot_type ? ` / ${u.pilot_type}` : ""}
              </div>
            )}
            {isPilot && (
              <div className={styles.pilotMetaGrid}>
                <div>
                  <span className={styles.detailLabel}>First / Last:</span>{" "}
                  {u.first_name || "—"} {u.last_name || ""}
                </div>
                <div>
                  <span className={styles.detailLabel}>Gender:</span>{" "}
                  {u.gender ?? "—"}
                </div>
                <div>
                  <span className={styles.detailLabel}>DOB:</span>{" "}
                  {u.date_of_birth ?? "—"}
                </div>
                <div>
                  <span className={styles.detailLabel}>Email Verified:</span>{" "}
                  {u.email_verified ? "Yes" : "No"}
                </div>
                <div>
                  <span className={styles.detailLabel}>Phone Verified:</span>{" "}
                  {u.phone_verified ? "Yes" : "No"}
                </div>
                <div>
                  <span className={styles.detailLabel}>Accepted Terms:</span>{" "}
                  {u.accepted_terms ? "Yes" : "No"}
                </div>
              </div>
            )}
            {isPilot && (
              <div className={styles.pilotMetaGrid}>
                <div>
                  <span className={styles.detailLabel}>Experience (yrs):</span>{" "}
                  {u.experience_years ?? "—"}
                </div>
                <div>
                  <span className={styles.detailLabel}>Flights:</span>{" "}
                  {u.flights_count ?? "—"}
                </div>
                {/* Passenger harness list is shown below in the Equipment section; avoid duplication here. */}
                {u.license_doc_filenames &&
                  u.license_doc_filenames.length > 0 && (
                    <div>
                      <span className={styles.detailLabel}>Licenses:</span>
                      <ul className={styles.fileList}>
                        {u.license_doc_filenames.map((name, i) => (
                          <li key={i}>
                            <button
                              type="button"
                              className={styles.linkButton}
                              onClick={() =>
                                openDocFrom(u.license_doc_paths, i)
                              }
                              title="Open document"
                            >
                              {name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            )}
            {isPilot && (
              <div className={styles.gearSection}>
                <div className={styles.sectionTitle}>Equipment</div>
                <div className={styles.gearLists}>
                  {(() => {
                    const wings = Array.from(
                      new Set([
                        ...(u.wing_models || []),
                        ...(u.wing_model ? [u.wing_model] : []),
                      ])
                    );
                    return (
                      <div>
                        <div className={styles.gearLabel}>Wings</div>
                        <div className={styles.gearList}>
                          {wings.length ? (
                            wings.map((w) => (
                              <span key={w} className={styles.gearChip}>
                                {w}
                              </span>
                            ))
                          ) : (
                            <span className={styles.emptyGear}>—</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  {(() => {
                    const harnesses = Array.from(
                      new Set([
                        ...(u.harness_models || []),
                        ...(u.harness_model ? [u.harness_model] : []),
                      ])
                    );
                    return (
                      <div>
                        <div className={styles.gearLabel}>Harness</div>
                        <div className={styles.gearList}>
                          {harnesses.length ? (
                            harnesses.map((h) => (
                              <span key={h} className={styles.gearChip}>
                                {h}
                              </span>
                            ))
                          ) : (
                            <span className={styles.emptyGear}>—</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  {(() => {
                    const reserves = Array.from(
                      new Set([
                        ...(u.reserve_models || []),
                        ...(u.reserve_model ? [u.reserve_model] : []),
                      ])
                    );
                    return (
                      <div>
                        <div className={styles.gearLabel}>Reserve</div>
                        <div className={styles.gearList}>
                          {reserves.length ? (
                            reserves.map((r) => (
                              <span key={r} className={styles.gearChip}>
                                {r}
                              </span>
                            ))
                          ) : (
                            <span className={styles.emptyGear}>—</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  {tandem &&
                    (() => {
                      const passengerHarnesses = Array.from(
                        new Set([
                          ...(u.passenger_harness_models || []),
                          ...(u.passenger_harness_model
                            ? [u.passenger_harness_model]
                            : []),
                        ])
                      );
                      return (
                        <div>
                          <div className={styles.gearLabel}>
                            Passenger Harness
                          </div>
                          <div className={styles.gearList}>
                            {passengerHarnesses.length ? (
                              passengerHarnesses.map((ph) => (
                                <span key={ph} className={styles.gearChip}>
                                  {ph}
                                </span>
                              ))
                            ) : (
                              <span className={styles.emptyGear}>—</span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                </div>
              </div>
            )}
            {isPilot && tandem && (
              <div className={styles.docsSection}>
                <div className={styles.sectionTitle}>
                  Verification Documents
                </div>
                {/* Thumbnail cards per equipment with model(s) and preview(s) */}
                <div className={styles.docsCardGrid}>
                  {/* Wing */}
                  <div className={styles.docsCard}>
                    <div className={styles.docsCardHeader}>
                      <div className={styles.gearLabel}>Wing</div>
                      <div className={styles.modelChipsRow}>
                        {(() => {
                          const wings = Array.from(
                            new Set([
                              ...(u.wing_models || []),
                              ...(u.wing_model ? [u.wing_model] : []),
                            ])
                          );
                          return wings.length ? (
                            wings.map((w) => (
                              <span key={w} className={styles.gearChip}>
                                {w}
                              </span>
                            ))
                          ) : (
                            <span className={styles.emptyGear}>—</span>
                          );
                        })()}
                      </div>
                    </div>
                    <DocThumbs
                      paths={u.wing_serial_doc_paths || []}
                      onOpen={(i) => openDocFrom(u.wing_serial_doc_paths!, i)}
                    />
                  </div>
                  {/* Harness */}
                  <div className={styles.docsCard}>
                    <div className={styles.docsCardHeader}>
                      <div className={styles.gearLabel}>Harness</div>
                      <div className={styles.modelChipsRow}>
                        {(() => {
                          const ar = Array.from(
                            new Set([
                              ...(u.harness_models || []),
                              ...(u.harness_model ? [u.harness_model] : []),
                            ])
                          );
                          return ar.length ? (
                            ar.map((v) => (
                              <span key={v} className={styles.gearChip}>
                                {v}
                              </span>
                            ))
                          ) : (
                            <span className={styles.emptyGear}>—</span>
                          );
                        })()}
                      </div>
                    </div>
                    <DocThumbs
                      paths={u.harness_serial_doc_paths || []}
                      onOpen={(i) =>
                        openDocFrom(u.harness_serial_doc_paths!, i)
                      }
                    />
                  </div>
                  {/* Reserve */}
                  <div className={styles.docsCard}>
                    <div className={styles.docsCardHeader}>
                      <div className={styles.gearLabel}>Reserve</div>
                      <div className={styles.modelChipsRow}>
                        {(() => {
                          const ar = Array.from(
                            new Set([
                              ...(u.reserve_models || []),
                              ...(u.reserve_model ? [u.reserve_model] : []),
                            ])
                          );
                          return ar.length ? (
                            ar.map((v) => (
                              <span key={v} className={styles.gearChip}>
                                {v}
                              </span>
                            ))
                          ) : (
                            <span className={styles.emptyGear}>—</span>
                          );
                        })()}
                      </div>
                    </div>
                    <DocThumbs
                      paths={u.reserve_packing_certificate_paths || []}
                      onOpen={(i) =>
                        openDocFrom(u.reserve_packing_certificate_paths!, i)
                      }
                    />
                  </div>
                  {/* Passenger Harness */}
                  <div className={styles.docsCard}>
                    <div className={styles.docsCardHeader}>
                      <div className={styles.gearLabel}>Passenger Harness</div>
                      <div className={styles.modelChipsRow}>
                        {(() => {
                          const ar = Array.from(
                            new Set([
                              ...(u.passenger_harness_models || []),
                              ...(u.passenger_harness_model
                                ? [u.passenger_harness_model]
                                : []),
                            ])
                          );
                          return ar.length ? (
                            ar.map((v) => (
                              <span key={v} className={styles.gearChip}>
                                {v}
                              </span>
                            ))
                          ) : (
                            <span className={styles.emptyGear}>—</span>
                          );
                        })()}
                      </div>
                    </div>
                    <DocThumbs
                      paths={u.passenger_harness_serial_doc_paths || []}
                      onOpen={(i) =>
                        openDocFrom(u.passenger_harness_serial_doc_paths!, i)
                      }
                    />
                  </div>
                  {/* Tandem Certificate */}
                  <div className={styles.docsCard}>
                    <div className={styles.docsCardHeader}>
                      <div className={styles.gearLabel}>Tandem Certificate</div>
                      {(() => {
                        const st =
                          u.tandem_certificate_status ||
                          ((u.tandem_certificate_doc_paths || []).length
                            ? "pending"
                            : "missing");
                        const cls =
                          st === "approved"
                            ? styles.active
                            : st === "rejected"
                            ? styles.rejected
                            : styles.pending;
                        return (
                          <div className={styles.certActions}>
                            <span className={`${styles.status} ${cls}`}>
                              <span
                                className={styles.statusDot}
                                aria-hidden="true"
                              ></span>
                              {st.charAt(0).toUpperCase() + st.slice(1)}
                            </span>
                            <button
                              type="button"
                              className={`${styles.certBtn} ${styles.certApprove}`}
                              title="Approve certificate"
                              disabled={
                                !(u.tandem_certificate_doc_paths || [])
                                  .length || st === "approved"
                              }
                              onClick={() =>
                                setTandemCertStatus(u.id, "approved")
                              }
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className={`${styles.certBtn} ${styles.certReject}`}
                              title="Reject certificate"
                              disabled={st === "rejected"}
                              onClick={() =>
                                setTandemCertStatus(u.id, "rejected")
                              }
                            >
                              Reject
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                    <DocThumbs
                      paths={u.tandem_certificate_doc_paths || []}
                      onOpen={(i) =>
                        openDocFrom(u.tandem_certificate_doc_paths!, i)
                      }
                    />
                  </div>
                </div>
              </div>
            )}
            {isPilot && u.license_doc_paths?.length ? (
              <div className={styles.docsSection}>
                <div className={styles.sectionTitle}>Licenses</div>
                <ul className={styles.fileList}>
                  {u.license_doc_paths.map((p, i) => (
                    <li key={p}>
                      <button
                        type="button"
                        className={styles.linkButton}
                        onClick={() => openDocFrom(u.license_doc_paths!, i)}
                      >
                        {u.license_doc_filenames?.[i] || `License #${i + 1}`}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
        {isEditing && !pendingPilot && !rejectedPilot && (
          <form
            className={styles.editForm}
            onSubmit={(e) => {
              e.preventDefault();
              saveEdit();
            }}
          >
            <div className={styles.formRow}>
              <label>
                Name
                <input
                  value={editDraft.name || ""}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, name: e.target.value }))
                  }
                />
              </label>
              <label>
                Email
                <input
                  value={editDraft.email || ""}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, email: e.target.value }))
                  }
                />
              </label>
            </div>
            <div className={styles.formRow}>
              <label>
                Phone
                <input
                  value={editDraft.phone || ""}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, phone: e.target.value }))
                  }
                />
              </label>
              <label>
                Location
                <input
                  value={editDraft.location || ""}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, location: e.target.value }))
                  }
                />
              </label>
            </div>
            {isPilot && (
              <div className={styles.formRow}>
                <label>
                  Rating
                  <input
                    type="range"
                    min={0}
                    max={5}
                    step={0.1}
                    value={editDraft.rating ?? 0}
                    onChange={(e) =>
                      setEditDraft((d) => ({
                        ...d,
                        rating: parseFloat(e.target.value),
                      }))
                    }
                  />
                  <span className={styles.rangeValue}>
                    {(editDraft.rating ?? 0).toFixed(1)}
                  </span>
                </label>
              </div>
            )}
            <div className={styles.formRow}>
              <label className={styles.fullWidth}>
                About
                <textarea
                  rows={3}
                  value={editDraft.about || ""}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, about: e.target.value }))
                  }
                />
              </label>
            </div>
            <div className={styles.editActions}>
              <button
                type="button"
                onClick={cancelEdit}
                className={styles.secondaryBtn}
              >
                Cancel
              </button>
              <button type="submit" className={styles.primaryBtn}>
                Save
              </button>
            </div>
          </form>
        )}
        {/* Removed duplicate detailActions block to avoid redundant Edit/Block controls below details.
            All actions are available in the main Actions column (desktop) and the card toolbar (mobile). */}
      </div>
    );
  };

  // Fetch users on mount
  useEffect(() => {
    let aborted = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/register/pilot-basic", {
          method: "GET",
          cache: "no-store",
        });
        let json: any = null;
        try {
          json = await res.json();
        } catch {}
        if (!res.ok) {
          const msg = json?.error
            ? `Failed to load users (${res.status}): ${json.error}`
            : `Failed to load users (${res.status})`;
          throw new Error(msg);
        }
        if (aborted) return;
        const list = (json.users || []) as User[];
        setUsers(list);
      } catch (e: any) {
        if (aborted) return;
        setError(e?.message || "Failed to load users");
      } finally {
        if (!aborted) setLoading(false);
      }
    };
    load();
    return () => {
      aborted = true;
    };
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.globalBar}>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={() => {
            setGlobalOpen(true);
            setGlobalText("");
            setGlobalAudience("everyone");
          }}
        >
          Create global message
        </button>
      </div>
      {loading && <div className={styles.loading}>Loading users…</div>}
      {error && <div className={styles.error}>Error: {error}</div>}
      <div className={styles.summaryBar}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total</span>
          <span className={styles.summaryValue}>{total}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Active</span>
          <span className={styles.summaryValue}>{active}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Pending</span>
          <span className={styles.summaryValue}>{pending}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Showing</span>
          <span className={styles.summaryValue}>{filteredUsers.length}</span>
        </div>
      </div>
      <div className={styles.mobileFiltersBar}>
        <button
          type="button"
          className={styles.mobileFiltersToggle}
          onClick={() => setMobileFiltersOpen((o) => !o)}
          aria-expanded={mobileFiltersOpen}
        >
          {mobileFiltersOpen ? "Hide Filters" : "Filters"}
          {(roleFilter || statusFilter || search) && (
            <span className={styles.filterCountBadge}>
              {[roleFilter, statusFilter, search].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>
      <form
        className={`${styles.filters} ${styles.responsiveFilters} ${
          mobileFiltersOpen ? styles.open : styles.closed
        }`}
        onSubmit={(e) => e.preventDefault()}
      >
        <div className={styles.searchWrapper}>
          <input
            className={styles.searchInput}
            placeholder="Search name, email, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className={styles.clearBtn}
            >
              ✕
            </button>
          )}
        </div>
        <select
          className={styles.filterSelect}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="superadmin">Superadmin</option>
          <option value="pilot (tandem)">Pilot (Tandem)</option>
          <option value="pilot (solo)">Pilot (Solo)</option>
          <option value="user">User</option>
          <option value="operator">Operator</option>
        </select>
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
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
              <th onClick={() => handleSort("name")}>
                Name {sortIndicator("name")}
              </th>
              <th>Role {sortIndicator("role")}</th>
              <th>Status {sortIndicator("status")}</th>
              <th onClick={() => handleSort("joined")}>
                Joined {sortIndicator("joined")}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <React.Fragment key={u.id}>
                <tr
                  className={styles.row}
                  data-expanded={expandedId === u.id || undefined}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("button")) return;
                    toggleExpand(u.id);
                  }}
                >
                  <td>
                    <div
                      className={`${styles.userCell} ${
                        expandedId === u.id ? styles.userCellExpanded : ""
                      }`}
                    >
                      <button
                        type="button"
                        aria-label={
                          expandedId === u.id ? "Collapse row" : "Expand row"
                        }
                        className={`${styles.expandToggle} ${
                          expandedId === u.id ? styles.expanded : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(u.id);
                        }}
                      >
                        <span className={styles.chevron}></span>
                      </button>
                      {u.avatar_signed_url ? (
                        <Image
                          src={u.avatar_signed_url}
                          alt={u.name}
                          width={36}
                          height={36}
                          className={styles.avatarImg}
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewerUrl(u.avatar_signed_url!);
                          }}
                        />
                      ) : (
                        <div className={styles.avatar}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className={styles.userName}>
                          {u.name}
                          {u.role === "Operator" && (
                            <span className={styles.badgeOperator}>
                              OPERATOR
                            </span>
                          )}
                          {u.blocked && (
                            <span className={styles.badgeBlocked}>BLOCKED</span>
                          )}
                        </div>
                        <div className={styles.userEmail}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{u.role}</td>
                  <td>
                    <span
                      className={`${styles.status} ${
                        styles[u.status.toLowerCase()]
                      }`}
                    >
                      <span
                        className={styles.statusDot}
                        aria-hidden="true"
                      ></span>
                      {u.status}
                    </span>
                  </td>
                  <td>{u.joined}</td>
                  <td className={styles.actions}>
                    {u.status === "Pending" &&
                      u.role.toLowerCase().includes("pilot") && (
                        <>
                          <button
                            className={styles.actionButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              openConfirm(
                                `Approve pilot ${u.name}?`,
                                async () => {
                                  // Call API approve-user
                                  try {
                                    await fetch("/api/register/pilot-basic", {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        action: "approve-user",
                                        userId: u.id,
                                      }),
                                    });
                                  } catch {}
                                  approvePilot(u.id);
                                }
                              );
                            }}
                          >
                            Approve
                          </button>
                          <button
                            className={`${styles.actionButton} ${styles.deleteButton}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setRejectUserId(u.id);
                              setRejectReason("");
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    {u.status !== "Pending" && u.status !== "Rejected" && (
                      <>
                        {(u.role === "User" || u.role === "Operator") && (
                          <button
                            className={styles.actionButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              openConfirm(
                                `${u.role === "User" ? "Make" : "Revert"} ${
                                  u.name
                                } ${u.role === "User" ? "Operator" : "User"}?`,
                                () => toggleUserOperator(u.id)
                              );
                            }}
                          >
                            {u.role === "User" ? "Make Operator" : "Make User"}
                          </button>
                        )}
                        {!(u.role === "User" || u.role === "Operator") && (
                          <button
                            className={styles.actionButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(u);
                            }}
                          >
                            Edit
                          </button>
                        )}
                        <button
                          className={styles.actionButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMsgUserId(u.id);
                            setMsgText("");
                          }}
                        >
                          Message
                        </button>
                        <button
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                          onClick={async (e) => {
                            e.stopPropagation();
                            openConfirm(
                              `Delete user ${u.name}? This will remove the account and uploaded documents.`,
                              async () => {
                                try {
                                  const res = await fetch(
                                    "/api/register/pilot-basic",
                                    {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        action: "delete-user-hard",
                                        userId: u.id,
                                      }),
                                    }
                                  );
                                  const json = await res
                                    .json()
                                    .catch(() => ({}));
                                  if (!res.ok) {
                                    toast.error(
                                      json?.error || "Failed to delete user"
                                    );
                                    return;
                                  }
                                  deleteUserRef.current &&
                                    deleteUserRef.current(u.id);
                                  toast.success("User deleted");
                                } catch (err: any) {
                                  toast.error(
                                    err?.message || "Failed to delete user"
                                  );
                                }
                              }
                            );
                          }}
                        >
                          Delete
                        </button>
                        <button
                          className={styles.actionButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            openConfirm(
                              `${u.blocked ? "Unblock" : "Block"} ${u.name}?`,
                              () => toggleBlock(u.id)
                            );
                          }}
                        >
                          {u.blocked ? "Unblock" : "Block"}
                        </button>
                      </>
                    )}
                    {u.status === "Rejected" && (
                      <span className={styles.rejectedTag}>Rejected</span>
                    )}
                  </td>
                </tr>
                {expandedId === u.id && (
                  <tr className={styles.expandRow}>
                    <td colSpan={5}>
                      <div
                        ref={(r) => {
                          expandRefs.current[u.id] = r;
                        }}
                        className={styles.expandAnimWrapper}
                      >
                        {renderDetails(u)}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {!filteredUsers.length && (
              <tr>
                <td colSpan={5} className={styles.noResults}>
                  No users match current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.mobileList}>
        {filteredUsers.map((u) => (
          <div key={u.id} className={styles.userCard}>
            <div
              className={styles.cardHeader}
              onClick={() => toggleExpand(u.id)}
            >
              {u.avatar_signed_url ? (
                <Image
                  src={u.avatar_signed_url}
                  alt={u.name}
                  width={44}
                  height={44}
                  className={styles.avatarLgImg}
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewerUrl(u.avatar_signed_url!);
                  }}
                />
              ) : (
                <div className={styles.avatarLg}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={styles.cardHeaderInfo}>
                <div className={styles.cardName}>
                  {u.name}
                  {u.blocked && (
                    <span className={styles.badgeBlocked}>BLOCKED</span>
                  )}
                </div>
                <div className={styles.cardEmail}>{u.email}</div>
                <div className={styles.cardMetaSmall}>{u.role}</div>
              </div>
              <span
                className={`${styles.status} ${styles[u.status.toLowerCase()]}`}
              >
                <span className={styles.statusDot} aria-hidden="true"></span>
                {u.status}
              </span>
            </div>
            {/* Mobile actions toolbar: Approve/Reject only visible when expanded to prevent accidental taps */}
            <div className={styles.cardActions}>
              {u.status === "Pending" &&
              u.role.toLowerCase().includes("pilot") ? (
                expandedId === u.id && (
                  <>
                    <button
                      className={styles.actionButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        openConfirm(`Approve pilot ${u.name}?`, async () => {
                          try {
                            await fetch("/api/register/pilot-basic", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                action: "approve-user",
                                userId: u.id,
                              }),
                            });
                          } catch {}
                          approvePilot(u.id);
                        });
                      }}
                    >
                      Approve
                    </button>
                    <button
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setRejectUserId(u.id);
                        setRejectReason("");
                      }}
                    >
                      Reject
                    </button>
                  </>
                )
              ) : u.status !== "Rejected" ? (
                expandedId === u.id && (
                  <>
                    {u.role === "User" || u.role === "Operator" ? (
                      <button
                        className={styles.actionButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          openConfirm(
                            `${u.role === "User" ? "Make" : "Revert"} ${
                              u.name
                            } ${u.role === "User" ? "Operator" : "User"}?`,
                            () => toggleUserOperator(u.id)
                          );
                        }}
                      >
                        {u.role === "User" ? "Make Operator" : "Make User"}
                      </button>
                    ) : (
                      <>
                        {editId !== u.id && (
                          <button
                            className={styles.actionButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(u);
                            }}
                          >
                            Edit
                          </button>
                        )}
                        {editId === u.id && (
                          <>
                            <button
                              className={styles.actionButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                openConfirm(`Save changes to ${u.name}?`, () =>
                                  saveEdit()
                                );
                              }}
                            >
                              Save
                            </button>
                            <button
                              className={styles.actionButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                openConfirm("Discard changes?", () =>
                                  cancelEdit()
                                );
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </>
                    )}
                    <button
                      className={styles.actionButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMsgUserId(u.id);
                        setMsgText("");
                      }}
                    >
                      Message
                    </button>
                    <button
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openConfirm(
                          `Delete user ${u.name}? This will remove the account and uploaded documents.`,
                          async () => {
                            try {
                              const res = await fetch(
                                "/api/register/pilot-basic",
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    action: "delete-user-hard",
                                    userId: u.id,
                                  }),
                                }
                              );
                              const json = await res.json().catch(() => ({}));
                              if (!res.ok) {
                                toast.error(
                                  json?.error || "Failed to delete user"
                                );
                                return;
                              }
                              deleteUserRef.current &&
                                deleteUserRef.current(u.id);
                              toast.success("User deleted");
                            } catch (err: any) {
                              toast.error(
                                err?.message || "Failed to delete user"
                              );
                            }
                          }
                        );
                      }}
                    >
                      Delete
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        openConfirm(
                          `${u.blocked ? "Unblock" : "Block"} ${u.name}?`,
                          () => toggleBlock(u.id)
                        );
                      }}
                    >
                      {u.blocked ? "Unblock" : "Block"}
                    </button>
                  </>
                )
              ) : (
                <span className={styles.rejectedTag}>Rejected</span>
              )}
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
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={closeConfirm}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={proceedConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {rejectUserId && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalBody}>
              <div style={{ fontWeight: 600, marginBottom: ".5rem" }}>
                Reject verification
              </div>
              <label
                style={{ fontSize: ".7rem", fontWeight: 600, color: "#475569" }}
              >
                Reason
              </label>
              <textarea
                rows={4}
                style={{ width: "100%", marginTop: ".35rem" }}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Describe why the verification is rejected..."
              />
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => {
                  if (!rejectSubmitting) setRejectUserId(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                disabled={rejectSubmitting || !rejectReason.trim()}
                onClick={async () => {
                  if (!rejectUserId) return;
                  try {
                    setRejectSubmitting(true);
                    await fetch("/api/register/pilot-basic", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "reject-user",
                        userId: rejectUserId,
                        reason: rejectReason.trim(),
                      }),
                    });
                    rejectPilot(rejectUserId);
                    setRejectUserId(null);
                  } finally {
                    setRejectSubmitting(false);
                  }
                }}
              >
                {rejectSubmitting ? "Sending..." : "Send & Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
      {msgUserId && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalBody}>
              <div style={{ fontWeight: 600, marginBottom: ".5rem" }}>
                Send message
              </div>
              <label
                style={{ fontSize: ".7rem", fontWeight: 600, color: "#475569" }}
              >
                Message
              </label>
              <textarea
                rows={4}
                style={{ width: "100%", marginTop: ".35rem" }}
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                placeholder="Write a message to the user..."
              />
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => {
                  if (!msgSubmitting) setMsgUserId(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                disabled={msgSubmitting || !msgText.trim()}
                onClick={async () => {
                  if (!msgUserId) return;
                  try {
                    setMsgSubmitting(true);
                    await fetch("/api/register/pilot-basic", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "send-message",
                        userId: msgUserId,
                        text: msgText.trim(),
                      }),
                    });
                    setMsgUserId(null);
                  } finally {
                    setMsgSubmitting(false);
                  }
                }}
              >
                {msgSubmitting ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
      {viewerUrl && (
        <div
          className={styles.imageOverlay}
          role="dialog"
          aria-modal="true"
          onClick={() => setViewerUrl(null)}
        >
          <button
            type="button"
            className={styles.imageClose}
            aria-label="Close"
            onClick={(e) => {
              e.stopPropagation();
              setViewerUrl(null);
            }}
          >
            ×
          </button>
          <div className={styles.imageBox} onClick={(e) => e.stopPropagation()}>
            <Image
              src={viewerUrl}
              alt="Avatar preview"
              fill
              className={styles.image}
              sizes="90vw"
            />
          </div>
        </div>
      )}
      {globalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal} style={{ maxWidth: 560 }}>
            <div className={styles.modalBody}>
              <div style={{ fontWeight: 600, marginBottom: ".75rem" }}>
                Create global message
              </div>
              <label
                style={{ fontSize: ".7rem", fontWeight: 600, color: "#475569" }}
              >
                Message
              </label>
              <textarea
                rows={4}
                style={{ width: "100%", marginTop: ".35rem" }}
                value={globalText}
                onChange={(e) => setGlobalText(e.target.value)}
                placeholder="Write a message to send..."
              />
              <div style={{ marginTop: "1rem" }}>
                <div
                  style={{
                    fontSize: ".7rem",
                    fontWeight: 600,
                    color: "#475569",
                    marginBottom: ".4rem",
                  }}
                >
                  Audience
                </div>
                <div className={styles.audienceGrid}>
                  <label className={styles.radioRow}>
                    <input
                      type="radio"
                      name="aud"
                      value="everyone"
                      checked={globalAudience === "everyone"}
                      onChange={() => setGlobalAudience("everyone")}
                    />{" "}
                    Everyone
                  </label>
                  <label className={styles.radioRow}>
                    <input
                      type="radio"
                      name="aud"
                      value="pilots"
                      checked={globalAudience === "pilots"}
                      onChange={() => setGlobalAudience("pilots")}
                    />{" "}
                    Pilots (Solo + Tandem)
                  </label>
                  <label className={styles.radioRow}>
                    <input
                      type="radio"
                      name="aud"
                      value="solo"
                      checked={globalAudience === "solo"}
                      onChange={() => setGlobalAudience("solo")}
                    />{" "}
                    Solo Pilots
                  </label>
                  <label className={styles.radioRow}>
                    <input
                      type="radio"
                      name="aud"
                      value="tandem"
                      checked={globalAudience === "tandem"}
                      onChange={() => setGlobalAudience("tandem")}
                    />{" "}
                    Tandem Pilots
                  </label>
                  <label className={styles.radioRow}>
                    <input
                      type="radio"
                      name="aud"
                      value="users"
                      checked={globalAudience === "users"}
                      onChange={() => setGlobalAudience("users")}
                    />{" "}
                    Users
                  </label>
                </div>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => {
                  if (!globalSubmitting) setGlobalOpen(false);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                disabled={globalSubmitting || !globalText.trim()}
                onClick={async () => {
                  try {
                    setGlobalSubmitting(true);
                    const res = await fetch("/api/register/pilot-basic", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "send-global-messages",
                        text: globalText.trim(),
                        audience: globalAudience,
                      }),
                    });
                    const json = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      toast.error(json?.error || "Failed to send messages");
                      return;
                    }
                    const updated = json?.updated ?? 0;
                    toast.success(`Message sent to ${updated} recipients`);
                    setGlobalOpen(false);
                    setGlobalText("");
                  } catch (e: any) {
                    toast.error(e?.message || "Failed to send messages");
                  } finally {
                    setGlobalSubmitting(false);
                  }
                }}
              >
                {globalSubmitting ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
