import './globals.css';
import './legacy-globals.css';
import ClientToaster from '../components/ClientToaster';

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>
				{children}
				<ClientToaster />
			</body>
		</html>
	);
}
