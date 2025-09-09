/** @type {import('next').NextConfig} */
const nextConfig = {
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
