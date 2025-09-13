import Dashboard from '@/components/superadmin/dashboard/Dashboard';
import { getServerRole } from '@/lib/getServerRole';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function AdminDashboardPage() {
	const role = await getServerRole();

	// Secure this page
	if (role !== 'superadmin') {
		redirect('/');
	}

	return <Dashboard />;
}
