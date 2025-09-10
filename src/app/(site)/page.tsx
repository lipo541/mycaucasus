import { HeroDynamic } from '../../components/hero/HeroDynamic';
import { redirect } from 'next/navigation';
import { getServerRole } from '../../lib/getServerRole';
import { AUTO_ADMIN_REDIRECT } from '../../config/featureFlags';
export const revalidate = 0; // always SSR

export default async function Home() {
  const role = await getServerRole();
  if (AUTO_ADMIN_REDIRECT && role === 'superadmin') {
    redirect('/admin');
  }
  return <HeroDynamic />;
}
