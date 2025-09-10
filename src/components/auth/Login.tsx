"use client";
import { useState } from 'react';
import Link from 'next/link';
import { FaGoogle, FaFacebook } from 'react-icons/fa';
import './Login.css';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { toast } from '../../lib/toast';
import { useRouter } from 'next/navigation';

export default function Login() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const router = useRouter();
	const supabase = createSupabaseBrowserClient();

	const handleOAuth = async (provider: 'google' | 'facebook') => {
		setLoading(true);
		setError(null);
		try {
			const { error } = await supabase.auth.signInWithOAuth({
				provider,
				options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined },
			});
			if (error) setError(error.message);
			else toast.info('გადამისამართება პროვაიდერზე...');
		} finally {
			setLoading(false);
		}
	};

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		// Basic validations
		if (!email.trim() || !password.trim()) {
			setError('იმეილი და პაროლი აუცილებელია.');
			return;
		}
		if (!/\S+@\S+\.\S+/.test(email)) {
			setError('გთხოვთ, შეიყვანოთ ვალიდური იმეილი.');
			return;
		}
		if (password.length < 6) {
			setError('პაროლი უნდა შედგებოდეს მინიმუმ 6 სიმბოლოსგან.');
			return;
		}

		setLoading(true);
		setSuccess(false);
		const {
			data: { user },
			error
		} = await supabase.auth.signInWithPassword({ email, password });
		setLoading(false);
		if (error) {
			setError(error.message);
		} else if (user) {
			const userRole = user.user_metadata.role;

			setSuccess(true);
			toast.success('წარმატებით გაიარეთ ავტორიზაცია!');

			if (userRole === 'superadmin') {
				router.push('/admin');
			} else {
				router.push('/');
			}
		}
	};

	return (
		<form onSubmit={handleLogin} className="login">
			<h2>შესვლა</h2>

			<div className="login__field">
				<input
					type="email"
					className="login__input"
					placeholder="Email"
					value={email}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
					required
					autoComplete="email"
				/>
			</div>

			<div className="login__field">
				<input
					type="password"
					className="login__input"
					placeholder="Password"
					value={password}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
					required
					autoComplete="current-password"
				/>
			</div>

			<button type="submit" disabled={loading} className="login__button">
				{loading ? 'შესვლა...' : 'შესვლა'}
			</button>

			{error && <div className="login__status login__status--error">{error}</div>}
			{success && <div className="login__status login__status--success">წარმატებით გაიარეთ ავტორიზაცია!</div>}

			<p className="login__meta">
				არ გაქვს ექაუნთი?{' '}
				<Link href="/register" className="login__link">რეგისტრაცია</Link>
			</p>

			<div className="login__divider"><span>ან</span></div>

			<div className="login__oauth">
				<button
					type="button"
					className="login__oauth-btn login__oauth-btn--google"
					onClick={() => handleOAuth('google')}
				>
					<FaGoogle className="login__icon login__icon--google" aria-hidden="true" />
					Google-ით შესვლა
				</button>
				<button
					type="button"
					className="login__oauth-btn login__oauth-btn--facebook"
					onClick={() => handleOAuth('facebook')}
				>
					<FaFacebook className="login__icon login__icon--facebook" aria-hidden="true" />
					Facebook-ით შესვლა
				</button>
			</div>
		</form>
	);
}
