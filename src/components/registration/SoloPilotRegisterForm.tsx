"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import '../auth/Login.css';
import styles from './SoloPilotRegisterForm.module.css';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { toast } from '../../lib/toast';
import { InfoTip } from '../ui/InfoTip';
import { MultiTextInput } from '../ui/MultiTextInput';
import { Select } from '../ui/Select';
import { uploadAvatar, uploadDocuments } from '@/lib/storage';

export function SoloPilotRegisterForm() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  // About + Pilot details (solo)
  const [about, setAbout] = useState('');
  const [experienceYears, setExperienceYears] = useState<number | ''>('');
  const [flightsCount, setFlightsCount] = useState<number | ''>('');
  const [experienceRaw, setExperienceRaw] = useState<string>('');
  const [flightsRaw, setFlightsRaw] = useState<string>('');
  const [wingModels, setWingModels] = useState<string[]>([]);
  const [harnessModels, setHarnessModels] = useState<string[]>([]);
  const [reserveModels, setReserveModels] = useState<string[]>([]);
  // Solo-specific: pilot type
  const [pilotType, setPilotType] = useState('');
  // Media
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [licenseFiles, setLicenseFiles] = useState<File[]>([]);
  // Helpers (basic validation removed)
  const isAscii = (s: string, allowNL = false) => {
    const re = allowNL ? /^[\x09\x0A\x0D\x20-\x7E]*$/ : /^[\x20-\x7E]*$/;
    return re.test(s || '');
  };
  const digitsOnly = (s: string) => /^\d+$/.test(s);
  const yearsValid = (s: string) => digitsOnly(s) && Number(s) >= 0 && Number(s) <= 60;
  const flightsValid = (s: string) => digitsOnly(s) && Number(s) >= 0;
  const MAX_AVATAR = 6 * 1024 * 1024; // 6MB
  const MAX_LICENSE = 5 * 1024 * 1024; // 5MB
  const showYearsErr = experienceRaw.length > 0 && !yearsValid(experienceRaw);
  const showFlightsErr = flightsRaw.length > 0 && !flightsValid(flightsRaw);
  const avatarTooBig = !!avatarFile && avatarFile.size > MAX_AVATAR;
  const licenseAnyTooBig = (licenseFiles || []).some(f => f.size > MAX_LICENSE);

  // Validation shortcuts
  const aboutAsciiOk = about ? isAscii(about, true) : true;
  const wingAsciiOk = wingModels.length === 0 ? false : wingModels.every(v => isAscii(v));
  const harnessAsciiOk = harnessModels.length === 0 ? false : harnessModels.every(v => isAscii(v));
  const reserveAsciiOk = reserveModels.length === 0 ? false : reserveModels.every(v => isAscii(v));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Solo-choice validation
    if (!pilotType) { toast.error('აირჩიეთ პილოტის ტიპი.'); return; }
    if (!digitsOnly(experienceRaw) || !yearsValid(experienceRaw)) { toast.error('გამოცდილება უნდა იყოს მხოლოდ ციფრებით 0-დან 60-მდე.'); return; }
    if (!digitsOnly(flightsRaw) || !flightsValid(flightsRaw)) { toast.error('ფრენების რაოდენობა უნდა იყოს მხოლოდ ციფრებით (0 ან მეტი).'); return; }
    if (wingModels.some(v=>!isAscii(v)) || harnessModels.some(v=>!isAscii(v)) || reserveModels.some(v=>!isAscii(v))) {
      toast.error('მოდელები მიუთითეთ ინგლისურად (ASCII).'); return;
    }
    if (!avatarFile) { toast.error('პროფილის სურათი აუცილებელია.'); return; }
    if (avatarTooBig) { toast.error('პროფილის სურათის ზომა არ უნდა აღემატებოდეს 6MB-ს.'); return; }
    if (licenseFiles.length < 1) { toast.error('ატვირთეთ სოლო პილოტის დამადასტურებელი დოკუმენტი (მინიმუმ 1).'); return; }
    if (licenseFiles.length > 7) { toast.error('ერთ ჯერზე ატვირთეთ მაქსიმუმ 7 დოკუმენტი.'); return; }
    if (licenseAnyTooBig) { toast.error('ყოველი დოკუმენტის ზომა არ უნდა აღემატებოდეს 5MB-ს.'); return; }

    try {
      const { data: session } = await supabase.auth.getUser();
      const userId = session.user?.id;
      if (!userId) throw new Error('მიმდინარე მომხმარებელი ვერ მოიძებნა.');

  const avatarRes = await uploadAvatar(userId, avatarFile);
  const docsRes = await uploadDocuments(userId, licenseFiles);

      const { error: updErr } = await supabase.auth.updateUser({
        data: {
          role: 'pilot',
          pilot_kind: 'solo',
          pilot_type: pilotType,
          status: 'pending',
          about,
          experience_years: experienceYears === '' ? null : Number(experienceYears),
          flights_count: flightsCount === '' ? null : Number(flightsCount),
          wing_models: wingModels,
          harness_models: harnessModels,
          reserve_models: reserveModels,
          wing_model: wingModels[0] || null,
          harness_model: harnessModels[0] || null,
          reserve_model: reserveModels[0] || null,
          avatar_storage_path: avatarRes.path,
          license_doc_storage_paths: docsRes.map(d => d.path),
        }
      });
      if (updErr) throw updErr;
      toast.success('ვერიფიკაციის დასრულების მოთხოვნა გაგზავნილია. სტატუსი: "მოლოდინი".');
      router.push('/');
    } catch (err: any) {
      toast.error(err.message || 'დაფიქსირდა შეცდომა');
    }
  };

  return (
  <form onSubmit={onSubmit} className={`login ${styles.form}`}>
        <h2>სოლო პილოტის ვერიფიკაცია</h2>
        {/* Solo: Pilot Type */}
  <div className={styles.row}>
          <div className="login__field">
            <Select
              value={pilotType}
              onChange={setPilotType}
              placeholder="პილოტის ტიპი"
              options={[
                { value: 'standard', label: 'ჩვეულებრივი' },
                { value: 'acro', label: 'აკრო' },
                { value: 'xc', label: 'კროს-კანთრი (XC)' },
              ]}
              ariaLabel="აირჩიეთ პილოტის ტიპი"
            />
            <input type="hidden" name="pilotType" value={pilotType} />
          </div>
        </div>

        {/* Experience (years) + Flights */}
  <div className={styles.row}>
          <div className="login__field">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="login__input"
              placeholder="გამოცდილება (წ.)"
              name="experienceYears"
              value={experienceRaw}
              onChange={e=>{ const v = e.target.value.trim(); setExperienceRaw(v); if (digitsOnly(v)) setExperienceYears(v === '' ? '' : Number(v)); else setExperienceYears(''); }}
            />
            <InfoTip success={experienceRaw.length>0 && yearsValid(experienceRaw)} error={showYearsErr} text={showYearsErr ? (!digitsOnly(experienceRaw) ? 'მხოლოდ ციფრებია დაშვებული (0-60).' : 'მიუთითეთ 0-60 დიაპაზონში.') : 'მიუთითეთ გამოცდილება წლებში (0-60).'} />
          </div>
          <div className="login__field">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="login__input"
              placeholder="ფრენების რაოდენობა"
              name="flightsCount"
              value={flightsRaw}
              onChange={e=>{ const v = e.target.value.trim(); setFlightsRaw(v); if (digitsOnly(v)) setFlightsCount(v === '' ? '' : Number(v)); else setFlightsCount(''); }}
            />
            <InfoTip success={flightsRaw.length>0 && flightsValid(flightsRaw)} error={showFlightsErr} text={showFlightsErr ? 'მხოლოდ ციფრებია დაშვებული (0 ან მეტი).' : 'სულ რამდენი ფრენა გაქვთ შესრულებული (შეიძლება 0-იც).'} />
          </div>
        </div>

        {/* Avatar */}
        <div className="login__field">
          <label htmlFor="avatar-file-solo" style={{display:'block', marginBottom:'.4rem'}}>ატვირთეთ პროფილის სურათი</label>
          <div className="login__field-inner">
            <input id="avatar-file-solo" name="avatar" type="file" className="login__input" onChange={e=>setAvatarFile(e.target.files?.[0] || null)} />
            <InfoTip success={!!avatarFile && !avatarTooBig} error={!avatarFile || avatarTooBig} text={!avatarFile ? "ფოტო უნდა იყოს მაღალი ხარისხის და პროფესიული გარემოში. მაქს ზომა: 6MB." : (avatarTooBig ? "ფაილი დიდია — მაქს 6MB." : "ფოტო მიღებულია (მაქს 6MB).") } />
          </div>
        </div>

        {/* About */}
        <div className="login__field">
          <textarea className="login__input" name="about" placeholder="მოკლე აღწერა" value={about} onChange={e=>setAbout(e.target.value)} rows={3} />
          <InfoTip success={about.length>0 && aboutAsciiOk} error={about.length>0 && !aboutAsciiOk} text={about.length>0 && !aboutAsciiOk ? 'ტექსტი ჩაწერეთ ინგლისურად.' : 'მოკლედ აღწერეთ გამოცდილება (ინგლისურად).'} />
        </div>

        {/* Gear lists */}
        <div className="login__field">
          <MultiTextInput values={wingModels} onChange={setWingModels} placeholder="ფრთის მოდელი (Enter)" ariaLabel="ფრთის მოდელები" inputName="wingModels" />
          <InfoTip success={wingModels.length>0 && wingAsciiOk} error={wingModels.length>0 && !wingAsciiOk} text={wingModels.length>0 && !wingAsciiOk ? 'მოდელები მიუთითეთ ინგლისურად.' : 'დაამატეთ ფრთის მოდელები (ინგლისურად).'} />
        </div>
        <div className="login__field">
          <MultiTextInput values={harnessModels} onChange={setHarnessModels} placeholder="სავარძლის მოდელი" ariaLabel="სავარძლის მოდელები" inputName="harnessModels" />
          <InfoTip success={harnessModels.length>0 && harnessAsciiOk} error={harnessModels.length>0 && !harnessAsciiOk} text={harnessModels.length>0 && !harnessAsciiOk ? 'სავარძლის მოდელები მიუთითეთ ინგლისურად.' : 'დაამატეთ სავარძლის მოდელები (ინგლისურად).'} />
        </div>
        <div className="login__field">
          <MultiTextInput values={reserveModels} onChange={setReserveModels} placeholder="სარეზერვო პარაშუტი" ariaLabel="სარეზერვო პარაშუტის მოდელები" inputName="reserveModels" />
          <InfoTip success={reserveModels.length>0 && reserveAsciiOk} error={reserveModels.length>0 && !reserveAsciiOk} text={reserveModels.length>0 && !reserveAsciiOk ? 'სარეზერვო მოდელები მიუთითეთ ინგლისურად.' : 'დაამატეთ სარეზერვო პარაშუტის მოდელები (ინგლისურად).'} />
        </div>

        {/* Proof documents */}
        <div className="login__field">
          <label htmlFor="license-docs-solo" style={{display:'block', marginBottom:'.4rem', fontSize:'.9rem'}}>
            ატვირთეთ ლიცენზია, დიპლომი ან სერთიფიკატი.
          </label>
          <div className="login__field-inner">
            <input
              type="file"
              className="login__input"
              accept="image/*,application/pdf,.doc,.docx,.odt,.rtf"
              id="license-docs-solo"
              name="licenseDocs"
              multiple
              onChange={e=> setLicenseFiles(Array.from(e.target.files || []))}
            />
            <InfoTip
              success={licenseFiles.length >= 1 && licenseFiles.length <= 7 && !licenseAnyTooBig}
              error={licenseFiles.length === 0 || licenseFiles.length > 7 || licenseAnyTooBig}
              text={
                licenseFiles.length === 0
                  ? 'ატვირთეთ სოლო პილოტის დამადასტურებელი დოკუმენტი(ები). მინ. 1, მაქს. 7, თითო ≤5MB.'
                  : (licenseFiles.length > 7
                    ? 'შეარჩიეთ მაქსიმუმ 7 ფაილი.'
                    : (licenseAnyTooBig
                      ? 'ზომა დიდია — თითოეული ფაილი მაქს 5MB.'
                      : 'დოკუმენტები მიღებულია (მინ. 1, მაქს. 7, თითო ≤5MB).'))
              }
            />
          </div>
        </div>

        <button type="submit" className="login__button">გაგზავნა</button>
    </form>
  );
}

export default SoloPilotRegisterForm;
