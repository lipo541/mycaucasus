/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		formats: ['image/avif', 'image/webp'],
		deviceSizes: [360, 640, 828, 1080, 1280, 1600, 1920],
		imageSizes: [64, 128, 256, 384],
		remotePatterns: [
			{ protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google avatars
			{ protocol: 'https', hostname: 'platform-lookaside.fbsbx.com' }, // Facebook avatar proxy
			{ protocol: 'https', hostname: 'scontent.xx.fbcdn.net' } // Fallback direct FB CDN pattern
		]
	},
	webpack: (config) => {
		const isRealtimeCritDep = (warning) => {
			const message = typeof warning === 'string' ? warning : warning?.message || '';
			let resource = typeof warning === 'object' && warning?.module?.resource ? warning.module.resource : '';
			// Normalize Windows paths to forward slashes for reliable matching
			if (resource && resource.replace) resource = resource.replace(/\\/g, '/');
			return (
				message.includes('Critical dependency: the request of a dependency is an expression') &&
				resource.includes('@supabase/realtime-js/dist/main/RealtimeClient.js')
			);
		};
		config.ignoreWarnings = [...(config.ignoreWarnings || []), isRealtimeCritDep];
		return config;
	},
};

module.exports = nextConfig
