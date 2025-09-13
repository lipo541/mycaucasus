import Login from '../../../components/auth/Login';
import { AuthRedirectGuard } from '../../../components/auth/AuthRedirectGuard';

export const metadata = { title: 'Login' };

export default function LoginPage() {
	return (
		<AuthRedirectGuard>
			<Login />
		</AuthRedirectGuard>
	);
}
