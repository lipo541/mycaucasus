"use client";
import React, { useState } from 'react';
import styles from './Addlocation.module.css';

type FlightPackage = {
	key: string; // e.g. 'acro', 'long', 'standard'
	title: string;
	description: string;
	info: string; // extra explanation text
	price: string;
	discount: string; // percentage or amount
};

type LocationSection = {
	id: string;
	heading: string;
	body: string;
	images: File[];
};

type LocationDraft = {
	description: string;
	tags: string[];
	heroImage: File | null;
	cardImage: File | null;
	slogan: string;
	mainText: string;
	infoCardTitle: string;
	infoCardText: string;
	flights: FlightPackage[];
	sections: LocationSection[];
};

export default function AddLocation() {
	const [ draft, setDraft ] = useState<LocationDraft>(() => ({
		description: '',
		tags: [],
		heroImage: null,
		cardImage: null,
		slogan: '',
		mainText: '',
		infoCardTitle: '',
		infoCardText: '',
		flights: [
			{ key: 'acro', title: 'აკრობატული ფრენა', description: '', info: '', price: '', discount: '' },
			{ key: 'long', title: 'ხანგრძლივი ფრენა', description: '', info: '', price: '', discount: '' },
			{ key: 'standard', title: 'სტანდარტული ფრენა', description: '', info: '', price: '', discount: '' }
		],
		sections: [
			{ id: 'sec-1', heading: '', body: '', images: [] },
			{ id: 'sec-2', heading: '', body: '', images: [] },
			{ id: 'sec-3', heading: '', body: '', images: [] },
		],
	}));
	const [ tagInput, setTagInput ] = useState('');
	const [ saving, setSaving ] = useState(false);
	const [ status, setStatus ] = useState('');

	const update = <K extends keyof LocationDraft>(field: K, value: LocationDraft[K]) => {
		setDraft(d => ({ ...d, [field]: value }));
	};

	const updateFlight = (key: string, field: keyof FlightPackage, value: string) => {
		setDraft(d => ({
			...d,
			flights: d.flights.map(f => f.key === key ? { ...f, [field]: value } : f)
		}));
	};

	const updateSection = (id: string, field: keyof LocationSection, value: any) => {
		setDraft(d => ({
			...d,
			sections: d.sections.map(s => s.id === id ? { ...s, [field]: value } : s)
		}));
	};

	const handleHeroImage = (file: File | null) => update('heroImage', file);
	const handleCardImage = (file: File | null) => update('cardImage', file);

	const addSectionImage = (id: string, files: FileList | null) => {
		if (!files || !files.length) return;
		setDraft(d => ({
			...d,
			sections: d.sections.map(s => s.id === id ? { ...s, images: [ ...s.images, ...Array.from(files) ] } : s)
		}));
	};

	const removeSectionImage = (id: string, index: number) => {
		setDraft(d => ({
			...d,
			sections: d.sections.map(s => s.id === id ? { ...s, images: s.images.filter((_, i) => i !== index) } : s)
		}));
	};

	const addTag = () => {
		const t = tagInput.trim();
		if (!t || draft.tags.includes(t)) return;
		setDraft(d => ({ ...d, tags: [ ...d.tags, t ] }));
		setTagInput('');
	};
	const removeTag = (t: string) => {
		setDraft(d => ({ ...d, tags: d.tags.filter(x => x !== t) }));
	};

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		// Basic validation
		if (!draft.slogan.trim()) { setStatus('სლოგანი აუცილებელია'); return; }
		if (!draft.heroImage) { setStatus('ატვირთე მთავარი ბექგრაუნდის სურათი'); return; }
		setSaving(true);
		setStatus('შენახვა...');
		try {
			// Simulate upload & save
			await new Promise(r => setTimeout(r, 900));
			setStatus('🚀 ლოკაცია დაემატა (გაშვება მოდელია)');
		} catch (e: any) { setStatus('შენახვის შეცდომა'); }
		finally { setSaving(false); }
	};

	return (
		<div className={styles.wrapper}>
			<h2 className={styles.title}>Add Location</h2>
			<p className={styles.desc}>მონაცემები ლოკაციის სრულ გვერდსა და ინფო ბარათზე გამოსატანად.</p>
			<form onSubmit={submit} className={styles.form}>

				<hr className={styles.hrSpace} />
				{/* Images & Slogan */}
				<div className={styles.fieldsetGroup}>
					<div className={styles.fieldset}>
						<span className={styles.legendInline}>სურათები & სლოგანი</span>
						<div className={styles.twoCol}>
							<div className={styles.fileInput}>
								<label>მთავარი ბექგრაუნდის სურათი *</label>
								<input type="file" accept="image/*" onChange={e => handleHeroImage(e.target.files?.[0] || null)} />
								{draft.heroImage && <span className={styles.smallNote}>{draft.heroImage.name}</span>}
							</div>
							<div className={styles.fileInput}>
								<label>ინფო ბარათის სურათი</label>
								<input type="file" accept="image/*" onChange={e => handleCardImage(e.target.files?.[0] || null)} />
								{draft.cardImage && <span className={styles.smallNote}>{draft.cardImage.name}</span>}
							</div>
						</div>
						<div className={styles.field}>
							<label htmlFor="loc-slogan">სლოგანი (H1) *</label>
							<input id="loc-slogan" value={draft.slogan} onChange={e => update('slogan', e.target.value)} placeholder="მაგ: ფრენა გუდაურის ზემოთ" />
						</div>
						<div className={styles.field}>
							<label htmlFor="loc-maintext">მთავარი ტექსტი</label>
							<textarea id="loc-maintext" rows={4} value={draft.mainText} onChange={e => update('mainText', e.target.value)} placeholder="სლოგანის შემდეგი ძირითადი ტექსტი..." />
							<span className={styles.smallNote}>ეს ტექსტი გამოჩნდება სლოგანის ქვემოთ.</span>
						</div>
					</div>
				</div>

				{/* Flight Packages */}
				<div className={styles.fieldset}>
					<span className={styles.legendInline}>ფრენის პაკეტები</span>
					<div className={styles.twoCol}>
						{draft.flights.map(f => (
							<div key={f.key} className={styles.flightBlock}>
								<div className={styles.flightHeader}>{f.title}</div>
								<div className={styles.field}>
									<label>აღწერა</label>
									<textarea rows={3} value={f.description} onChange={e => updateFlight(f.key, 'description', e.target.value)} placeholder="აღწერა..." />
								</div>
								<div className={styles.field}>
									<label>დამატებითი ინფორმაცია</label>
									<textarea rows={2} value={f.info} onChange={e => updateFlight(f.key, 'info', e.target.value)} placeholder="ინფო..." />
								</div>
								<div className={styles.inlineInputs}>
									<div className={styles.field}>
										<label>ფასი</label>
										<input value={f.price} onChange={e => updateFlight(f.key, 'price', e.target.value)} placeholder="₾" />
									</div>
									<div className={styles.field}>
										<label>ფასდაკლება %</label>
										<input value={f.discount} onChange={e => updateFlight(f.key, 'discount', e.target.value)} placeholder="10" />
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Info Card Text */}
				<div className={styles.fieldset}>
					<span className={styles.legendInline}>ინფო ბარათის ტექსტი</span>
					<div className={styles.cardFields}>
						<div className={styles.field}>
							<label>ბარათის სათაური</label>
							<input value={draft.infoCardTitle} onChange={e => update('infoCardTitle', e.target.value)} />
						</div>
						<div className={styles.field}>
							<label>ბარათის ტექსტი</label>
							<textarea rows={3} value={draft.infoCardText} onChange={e => update('infoCardText', e.target.value)} />
						</div>
					</div>
				</div>

				{/* Location Sections */}
				<div className={styles.fieldset}>
					<span className={styles.legendInline}>ლოკაციის სექციები (3)</span>
					<div className={styles.stack}>
						{draft.sections.map((s, idx) => (
							<div key={s.id} className={styles.sectionGroup}>
								<div className={styles.sectionTitleRow}>
									<div className={styles.sectionIndex}>{idx+1}</div>
									<input className={styles.grow} placeholder="სექციის სათაური" value={s.heading} onChange={e => updateSection(s.id, 'heading', e.target.value)} />
								</div>
								<textarea rows={4} placeholder="სექციის ტექსტი..." value={s.body} onChange={e => updateSection(s.id, 'body', e.target.value)} />
								<div className={styles.fileInput}>
									<label>სურათების დამატება</label>
									<input type="file" multiple accept="image/*" onChange={e => addSectionImage(s.id, e.target.files)} />
									{ s.images.length > 0 && (
										<div className={styles.imagesRow}>
											{s.images.map((f,i) => (
												<div key={i} className={styles.imagePreviewWrapper}>
													<img src={URL.createObjectURL(f)} alt={f.name} />
													<button type="button" className={styles.removeImageBtn} onClick={() => removeSectionImage(s.id, i)}>×</button>
												</div>
											))}
										</div>
									)}
									<span className={styles.smallNote}>შეგიძლია რამდენიმე სურათი დაამატო.</span>
								</div>
							</div>
						))}
					</div>
				</div>
				<div className={styles.field}>
					<label htmlFor="loc-desc">აღწერა</label>
						<textarea id="loc-desc" rows={4} value={draft.description} onChange={e => update('description', e.target.value)} placeholder="მოკლე აღწერა, ქარი, დაშვების პუნქტი..." />
						<span className={styles.smallNote}>თუ გჭირდება Markdown, მოგვიანებით დავამატებთ.</span>
				</div>
				<div className={styles.field}>
					<label htmlFor="loc-tag">ტეგები</label>
					<div style={{display:'flex', gap:'.5rem'}}>
						<input id="loc-tag" value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="მაგ: thermal" onKeyDown={e => { if (e.key === 'Enter'){ e.preventDefault(); addTag(); }}} />
						<button type="button" className={styles.btn} onClick={addTag} disabled={!tagInput.trim()}>დამატება</button>
					</div>
					{draft.tags.length > 0 && (
						<div className={styles.chips}>
							{draft.tags.map(t => (
								<span key={t} className={styles.chip}>{t}<button type="button" onClick={() => removeTag(t)} aria-label={`წაშალე ${t}`}>×</button></span>
							))}
						</div>
					)}
				</div>
				<div className={styles.actions}>
					<button type="reset" className={`${styles.btn} ${styles.danger}`} onClick={() => { setStatus('გაქრა ფორმა'); window.location.reload(); }}>გასუფთავება</button>
					<button type="submit" className={`${styles.btn} ${styles.primary}`} disabled={saving}>{saving ? 'შენახვა...' : 'შენახვა'}</button>
				</div>
				<div className={styles.status}>{status}</div>
			</form>
		</div>
	);
}
