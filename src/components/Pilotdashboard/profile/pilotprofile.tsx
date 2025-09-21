"use client";
import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import styles from './pilotprofile.module.css';
import { usePilot } from '../PilotContext';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { getSignedAvatarUrl, getSignedDocumentUrl, uploadAvatar, uploadDocuments } from '@/lib/storage';
import { toast } from '@/lib/toast';

type RawMeta = Record<string, any> | null | undefined;

export default function PilotProfile() {
  const { pilotKind, isSolo, isTandem } = usePilot();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [meta, setMeta] = useState<RawMeta>(null);
  const [email, setEmail] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [licenseUrls, setLicenseUrls] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit states
  const [editingBasic, setEditingBasic] = useState(false);
  const [editingPilot, setEditingPilot] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(false);
  const [editingLicenses, setEditingLicenses] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showImage, setShowImage] = useState(false);
  
  // Online status states
  const [isOnline, setIsOnline] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');
  
  const locations = [
    'gudauri',
    'svaneti', 
    'sighnagi',
    'tbilisi',
    'rustavi'
  ];
  
  // Form data
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    gender: '',
    date_of_birth: '',
    about: '',
    experience_years: 0,
    flights_count: 0,
    wing_models: [] as string[],
    harness_models: [] as string[],
    passenger_harness_models: [] as string[],
    reserve_models: [] as string[],
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const u = data.user;
        const raw = (u?.user_metadata as any) || (u?.app_metadata as any) || null;
        const rawUser = (u?.user_metadata as any) || null; // Supabase stores custom fields in user_metadata
        if (!mounted) return;
        setMeta(rawUser || raw);
        setEmail(u?.email || '');
        
        // Initialize form data
        if (rawUser) {
          setFormData({
            full_name: rawUser.full_name || '',
            phone: rawUser.phone || '',
            gender: rawUser.gender || '',
            date_of_birth: rawUser.date_of_birth || '',
            about: rawUser.about || '',
            experience_years: rawUser.experience_years || 0,
            flights_count: rawUser.flights_count || 0,
            wing_models: rawUser.wing_models || [],
            harness_models: rawUser.harness_models || [],
            passenger_harness_models: rawUser.passenger_harness_models || [],
            reserve_models: rawUser.reserve_models || [],
          });
          
          // Initialize online status from active field
          const activeStatus = rawUser.active || 'offline';
          if (activeStatus === 'offline') {
            setIsOnline(false);
            setSelectedLocation('');
          } else {
            setIsOnline(true);
            setSelectedLocation(activeStatus);
          }
        }

        const avatarPath = rawUser?.avatar_storage_path as string | undefined;
        if (avatarPath) {
          try {
            const url = await getSignedAvatarUrl(avatarPath);
            if (!mounted) return;
            setAvatarUrl(url);
          } catch {}
        }
        const licensePaths = (rawUser?.license_doc_storage_paths as string[] | undefined) || [];
        if (licensePaths.length) {
          try {
            const urls = await Promise.all(licensePaths.map((p) => getSignedDocumentUrl(p)));
            if (!mounted) return;
            setLicenseUrls(urls);
          } catch {}
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const get = <T,>(key: string, fallback: T): T => {
    const v = (meta && (meta as any)[key]) as T | undefined;
    return (v !== undefined && v !== null && (typeof v !== 'string' || v.length > 0)) ? v : fallback;
  };

  const isCertified = useMemo(() => {
    const licensePaths = (meta as any)?.license_doc_storage_paths as string[] | undefined;
    return licensePaths && licensePaths.length > 0;
  }, [meta]);

  const handleAvatarUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (!userId) throw new Error('No user ID');
      
      const { path } = await uploadAvatar(userId, file);
      const newUrl = await getSignedAvatarUrl(path);
      
      // Update user metadata
      await supabase.auth.updateUser({
        data: { avatar_storage_path: path }
      });
      
      setAvatarUrl(newUrl);
      toast.success('Avatar updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleLicenseUpload = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    try {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (!userId) throw new Error('No user ID');
      
      const results = await uploadDocuments(userId, files);
      const newPaths = results.map(r => r.path);
      const existingPaths = (meta as any)?.license_doc_storage_paths || [];
      const allPaths = [...existingPaths, ...newPaths];
      
      // Update user metadata
      await supabase.auth.updateUser({
        data: { license_doc_storage_paths: allPaths }
      });
      
      // Refresh license URLs
      const urls = await Promise.all(allPaths.map(p => getSignedDocumentUrl(p)));
      setLicenseUrls(urls);
      
      // Update local meta
      setMeta(prev => ({ ...prev, license_doc_storage_paths: allPaths }));
      
      toast.success('License documents uploaded');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  const saveChanges = async (updates: Partial<typeof formData>) => {
    setSaving(true);
    try {
      await supabase.auth.updateUser({
        data: updates
      });
      
      // Update local state
      setMeta(prev => ({ ...prev, ...updates }));
      setFormData(prev => ({ ...prev, ...updates }));
      
      toast.success('Profile updated');
      return true;
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save changes');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const addToList = (listKey: keyof typeof formData, value: string) => {
    if (!value.trim()) return;
    const current = formData[listKey] as string[];
    if (!current.includes(value)) {
      setFormData(prev => ({
        ...prev,
        [listKey]: [...current, value]
      }));
    }
  };

  const removeFromList = (listKey: keyof typeof formData, index: number) => {
    const current = formData[listKey] as string[];
    setFormData(prev => ({
      ...prev,
      [listKey]: current.filter((_, i) => i !== index)
    }));
  };

  const handleStatusToggle = async () => {
    if (!isOnline) {
      // Going online - open modal to select location
      setShowLocationModal(true);
      return;
    } else {
      // Going offline - set active to "offline"
      setSaving(true);
      try {
        await supabase.auth.updateUser({
          data: { 
            active: 'offline'
          }
        });
        
        setIsOnline(false);
        setSelectedLocation('');
        setMeta(prev => ({ ...prev, active: 'offline' }));
        toast.success('Status updated to offline');
      } catch (err: any) {
        toast.error(err?.message || 'Failed to update status');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleLocationSelect = async (location: string) => {
    setSaving(true);
    try {
      await supabase.auth.updateUser({
        data: { 
          active: location
        }
      });
      
      setIsOnline(true);
      setSelectedLocation(location);
      setEditingStatus(false);
      setMeta(prev => ({ ...prev, active: location }));
      toast.success(`Status updated: Active now in ${location}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (selectedLocation) return `Active now in ${selectedLocation}`;
    return 'Online';
  };

  return (
    <div className={styles.container}>

      {/* Profile + Status */}
      <div className={styles.section}>
        <div className={styles.headerBar}>
          <h3 className={styles.header}>Profile</h3>
          <div className={styles.headerControls}>
            <button
              className={`${styles.button} ${isOnline ? styles.goOfflineBtn : styles.goActiveBtn} ${styles.buttonTiny}`}
              onClick={() => {
                if (!isOnline) {
                  setShowLocationModal(true);
                } else {
                  handleStatusToggle();
                }
              }}
              disabled={saving}
            >
              {saving ? 'Updating...' : (isOnline ? 'Go Offline' : 'Go Active')}
            </button>
            <div className={styles.statusInline}>
              <span className={`${styles.dotSmall} ${isOnline ? styles.dotGreen : styles.dotRed} ${styles.pulse}`}></span>
              <span className={styles.statusText}>
                {isOnline && selectedLocation ? `active now in ${selectedLocation}` : 'offline'}
              </span>
            </div>
          </div>
        </div>
        <div className={`${styles.row} ${styles.rowAvatar}`}>
          <div className={styles.label}>Avatar</div>
          <div className={styles.value}>
            <div className={styles.avatarRow}>
              <div className={styles.avatarStack}>
                <div className={styles.avatarBox}>
                  {avatarUrl ? (
                    <Image
                      className={`${styles.avatar} ${styles.avatarClickable}`}
                      src={avatarUrl}
                      alt="Avatar"
                      width={64}
                      height={64}
                      sizes="64px"
                      onClick={() => setShowImage(true)}
                    />
                  ) : (
                    <span className={styles.muted}>No avatar</span>
                  )}
                </div>
                <button 
                  className={styles.avatarUploadButton}
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Update Profile Picture'}
                </button>
                <input 
                  id="avatar-upload"
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
                  className={styles.hiddenFileInput}
                />
                {uploading && <div className={styles.uploadProgress}>Uploading...</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Modal (global) */}
      {showLocationModal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>Select your location</div>
              <button className={styles.closeBtn} onClick={() => setShowLocationModal(false)}>Close</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.locationGrid}>
                {locations.map((location) => (
                  <button
                    key={location}
                    className={`${styles.locationOption} ${selectedLocation === location ? styles.locationSelected : ''}`}
                    onClick={async () => {
                      await handleLocationSelect(location);
                      setShowLocationModal(false);
                    }}
                    disabled={saving}
                  >
                    {location.charAt(0).toUpperCase() + location.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.button} onClick={() => setShowLocationModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Image preview overlay */}
      {showImage && avatarUrl && (
        <div className={styles.imageOverlay} role="dialog" aria-modal="true" onClick={() => setShowImage(false)}>
          <div className={styles.imageBox} onClick={(e) => e.stopPropagation()}>
            <button className={styles.imageClose} onClick={() => setShowImage(false)} aria-label="Close">×</button>
            <Image src={avatarUrl} alt="Avatar preview" fill className={styles.image} sizes="100vw" />
          </div>
        </div>
      )}

  {/* Basic Info Section */}
  <div className={`${styles.section} ${!editingBasic ? styles.twoCol : ''} ${editingBasic ? styles.editSection : ''}`}>
        <h3 className={styles.header}>Basic Information</h3>
        {!editingBasic ? (
          <>
            <div className={styles.row}>
              <div className={styles.label} data-field="name">Name</div>
              <div className={styles.value}>{get<string>('full_name', '—')}</div>
            </div>
            <div className={styles.row}>
              <div className={styles.label} data-field="email">Email</div>
              <div className={styles.value}>{email || '—'}</div>
            </div>
            <div className={styles.row}>
              <div className={styles.label} data-field="phone">Phone</div>
              <div className={styles.value}>{get<string>('phone', '—')}</div>
            </div>
            <div className={styles.row}>
              <div className={styles.label} data-field="gender">Gender</div>
              <div className={styles.value}>{get<string>('gender', '—')}</div>
            </div>
            <div className={styles.row}>
              <div className={styles.label} data-field="dob">Date of birth</div>
              <div className={styles.value}>{get<string>('date_of_birth', '—')}</div>
            </div>
            <div className={styles.row}>
              <div className={styles.label} data-field="about">About</div>
              <div className={styles.value}>{get<string>('about', '') || <span className={styles.muted}>No bio yet</span>}</div>
            </div>
            <div className={styles.actions}>
              <button className={styles.button} onClick={() => setEditingBasic(true)}>Edit</button>
            </div>
          </>
        ) : (
          <div className={styles.fieldGroup}>
            <div className={styles.fieldRow}>
              <div className={styles.label} data-field="name">Name</div>
              <input 
                className={styles.input} 
                value={formData.full_name} 
                onChange={(e) => setFormData(prev => ({...prev, full_name: e.target.value}))}
              />
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.label} data-field="phone">Phone</div>
              <input 
                className={styles.input} 
                value={formData.phone} 
                onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
              />
            </div>
            <div className={styles.row}>
              <div className={styles.label} data-field="gender">Gender</div>
              <select 
                className={styles.input} 
                value={formData.gender} 
                onChange={(e) => setFormData(prev => ({...prev, gender: e.target.value}))}
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.label} data-field="dob">Date of birth</div>
              <div className={styles.value}>{get<string>('date_of_birth', '—')}</div>
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.label} data-field="about">About</div>
              <textarea 
                className={styles.input} 
                rows={4}
                value={formData.about} 
                onChange={(e) => setFormData(prev => ({...prev, about: e.target.value}))}
              />
            </div>
            <div className={styles.actions}>
              <button 
                className={styles.button} 
                onClick={async () => {
                  const success = await saveChanges({
                    full_name: formData.full_name,
                    phone: formData.phone,
                    gender: formData.gender,
                    about: formData.about
                  });
                  if (success) setEditingBasic(false);
                }}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button className={styles.button} onClick={() => setEditingBasic(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Pilot Information */}
      <div className={`${styles.section} ${editingPilot ? styles.editSection : ''}`}>
        <h3 className={styles.header}>Pilot Information</h3>
        {!editingPilot ? (
          <>
            <div className={styles.row}>
              <div className={styles.label} data-field="kind">Kind</div>
              <div className={styles.value}>{pilotKind ? pilotKind.charAt(0).toUpperCase() + pilotKind.slice(1) : '—'}</div>
            </div>
            <div className={styles.row}>
              <div className={styles.label} data-field="cert">Certification</div>
              <div className={styles.value}>
                <span className={`${styles.statusBadge} ${isCertified ? styles.certified : styles.uncertified}`}>
                  <span className={styles.statusDot}></span>
                  {isCertified ? 'Certified' : 'Not Certified'}
                </span>
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.label} data-field="exp">Experience (yrs)</div>
              <div className={styles.value}>{get<number>('experience_years', 0) || '—'}</div>
            </div>
            <div className={styles.row}>
              <div className={styles.label} data-field="flights">Flights</div>
              <div className={styles.value}>{get<number>('flights_count', 0) || '—'}</div>
            </div>
            <div className={styles.actions}>
              <button className={styles.button} onClick={() => setEditingPilot(true)}>Edit</button>
            </div>
          </>
        ) : (
          <div className={styles.fieldGroup}>
            <div className={styles.fieldRow}>
              <div className={styles.label} data-field="exp">Experience (yrs)</div>
              <input 
                type="number"
                min="0"
                className={styles.input} 
                value={formData.experience_years} 
                onChange={(e) => setFormData(prev => ({...prev, experience_years: parseInt(e.target.value) || 0}))}
              />
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.label} data-field="flights">Flights</div>
              <input 
                type="number"
                min="0"
                className={styles.input} 
                value={formData.flights_count} 
                onChange={(e) => setFormData(prev => ({...prev, flights_count: parseInt(e.target.value) || 0}))}
              />
            </div>
            <div className={styles.actions}>
              <button 
                className={styles.button} 
                onClick={async () => {
                  const success = await saveChanges({
                    experience_years: formData.experience_years,
                    flights_count: formData.flights_count
                  });
                  if (success) setEditingPilot(false);
                }}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button className={styles.button} onClick={() => setEditingPilot(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Equipment Section */}
      <div className={`${styles.section} ${editingEquipment ? styles.editSection : ''}`}>
        <h3 className={styles.header}>Equipment</h3>
        {!editingEquipment ? (
          <>
            <div className={styles.row}>
              <div className={styles.label}>Wing models</div>
              <div className={styles.value}>{(get<string[]>('wing_models', [])).join(', ') || '—'}</div>
            </div>
            <div className={styles.row}>
              <div className={styles.label}>Harness models</div>
              <div className={styles.value}>{(get<string[]>('harness_models', [])).join(', ') || '—'}</div>
            </div>
            {isTandem && (
              <div className={styles.row}>
                <div className={styles.label}>Passenger harnesses</div>
                <div className={styles.value}>{(get<string[]>('passenger_harness_models', [])).join(', ') || '—'}</div>
              </div>
            )}
            <div className={styles.row}>
              <div className={styles.label}>Reserve models</div>
              <div className={styles.value}>{(get<string[]>('reserve_models', [])).join(', ') || '—'}</div>
            </div>
            <div className={styles.actions}>
              <button className={styles.button} onClick={() => setEditingEquipment(true)}>Edit</button>
            </div>
          </>
        ) : (
          <div className={styles.fieldGroup}>
            {/* Wing Models */}
            <div className={styles.fieldRow}>
              <div className={styles.label}>Wing models</div>
              <div className={styles.listEditor}>
                {formData.wing_models.map((model, i) => (
                  <div key={i} className={styles.listItem}>
                    <input 
                      className={styles.input} 
                      value={model} 
                      onChange={(e) => {
                        const newModels = [...formData.wing_models];
                        newModels[i] = e.target.value;
                        setFormData(prev => ({...prev, wing_models: newModels}));
                      }}
                    />
                    <button 
                      className={styles.removeButton} 
                      onClick={() => removeFromList('wing_models', i)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className={styles.listItem}>
                  <input 
                    className={styles.input} 
                    placeholder="Add wing model..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addToList('wing_models', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button 
                    className={styles.addButton}
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addToList('wing_models', input.value);
                      input.value = '';
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Harness Models */}
            <div className={styles.fieldRow}>
              <div className={styles.label}>Harness models</div>
              <div className={styles.listEditor}>
                {formData.harness_models.map((model, i) => (
                  <div key={i} className={styles.listItem}>
                    <input 
                      className={styles.input} 
                      value={model} 
                      onChange={(e) => {
                        const newModels = [...formData.harness_models];
                        newModels[i] = e.target.value;
                        setFormData(prev => ({...prev, harness_models: newModels}));
                      }}
                    />
                    <button 
                      className={styles.removeButton} 
                      onClick={() => removeFromList('harness_models', i)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className={styles.listItem}>
                  <input 
                    className={styles.input} 
                    placeholder="Add harness model..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addToList('harness_models', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button 
                    className={styles.addButton}
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addToList('harness_models', input.value);
                      input.value = '';
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Passenger Harness Models (Tandem only) */}
            {isTandem && (
              <div className={styles.fieldRow}>
                <div className={styles.label}>Passenger harnesses</div>
                <div className={styles.listEditor}>
                  {formData.passenger_harness_models.map((model, i) => (
                    <div key={i} className={styles.listItem}>
                      <input 
                        className={styles.input} 
                        value={model} 
                        onChange={(e) => {
                          const newModels = [...formData.passenger_harness_models];
                          newModels[i] = e.target.value;
                          setFormData(prev => ({...prev, passenger_harness_models: newModels}));
                        }}
                      />
                      <button 
                        className={styles.removeButton} 
                        onClick={() => removeFromList('passenger_harness_models', i)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <div className={styles.listItem}>
                    <input 
                      className={styles.input} 
                      placeholder="Add passenger harness..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addToList('passenger_harness_models', e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <button 
                      className={styles.addButton}
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        addToList('passenger_harness_models', input.value);
                        input.value = '';
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Reserve Models */}
            <div className={styles.fieldRow}>
              <div className={styles.label}>Reserve models</div>
              <div className={styles.listEditor}>
                {formData.reserve_models.map((model, i) => (
                  <div key={i} className={styles.listItem}>
                    <input 
                      className={styles.input} 
                      value={model} 
                      onChange={(e) => {
                        const newModels = [...formData.reserve_models];
                        newModels[i] = e.target.value;
                        setFormData(prev => ({...prev, reserve_models: newModels}));
                      }}
                    />
                    <button 
                      className={styles.removeButton} 
                      onClick={() => removeFromList('reserve_models', i)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className={styles.listItem}>
                  <input 
                    className={styles.input} 
                    placeholder="Add reserve model..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addToList('reserve_models', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button 
                    className={styles.addButton}
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addToList('reserve_models', input.value);
                      input.value = '';
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <button 
                className={styles.button} 
                onClick={async () => {
                  const success = await saveChanges({
                    wing_models: formData.wing_models,
                    harness_models: formData.harness_models,
                    passenger_harness_models: formData.passenger_harness_models,
                    reserve_models: formData.reserve_models
                  });
                  if (success) setEditingEquipment(false);
                }}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button className={styles.button} onClick={() => setEditingEquipment(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Licenses Section */}
      <div className={`${styles.section} ${editingLicenses ? styles.editSection : ''}`}>
        <h3 className={styles.header}>Licenses</h3>
        {!editingLicenses ? (
          <>
            {licenseUrls && licenseUrls.length > 0 ? (
              <ul className={styles.fileList}>
                {licenseUrls.map((url, i) => (
                  <li key={i} className={styles.fileItem}>
                    <span>License #{i + 1}</span>
                    <a href={url} target="_blank" rel="noopener noreferrer" className={styles.linkButton}>Open</a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.muted}>No license documents</div>
            )}
            <div className={styles.actions}>
              <button className={styles.button} onClick={() => setEditingLicenses(true)}>Manage</button>
            </div>
          </>
        ) : (
          <div className={styles.fieldGroup}>
            {licenseUrls && licenseUrls.length > 0 && (
              <div>
                <div className={styles.label}>Current licenses:</div>
                <ul className={styles.fileList}>
                  {licenseUrls.map((url, i) => (
                    <li key={i} className={styles.fileItem}>
                      <span>License #{i + 1}</span>
                      <div>
                        <a href={url} target="_blank" rel="noopener noreferrer" className={styles.linkButton}>Open</a>
                        <button 
                          className={styles.removeButton}
                          onClick={async () => {
                            const currentPaths = (meta as any)?.license_doc_storage_paths || [];
                            const newPaths = currentPaths.filter((_: any, idx: number) => idx !== i);
                            
                            try {
                              await supabase.auth.updateUser({
                                data: { license_doc_storage_paths: newPaths }
                              });
                              
                              if (newPaths.length > 0) {
                                const urls = await Promise.all(newPaths.map((p: string) => getSignedDocumentUrl(p)));
                                setLicenseUrls(urls);
                              } else {
                                setLicenseUrls([]);
                              }
                              
                              setMeta(prev => ({ ...prev, license_doc_storage_paths: newPaths }));
                              toast.success('License removed');
                            } catch (err: any) {
                              toast.error(err?.message || 'Failed to remove license');
                            }
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className={styles.fieldRow}>
              <div className={styles.label}>Add licenses</div>
              <div className={styles.inputGroup}>
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length) handleLicenseUpload(files);
                  }}
                  className={styles.fileInput}
                  disabled={uploading}
                />
                {uploading && <div className={styles.uploadProgress}>Uploading documents...</div>}
              </div>
            </div>
            
            <div className={styles.actions}>
              <button className={styles.button} onClick={() => setEditingLicenses(false)}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
