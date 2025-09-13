import { SoloPilotRegisterForm } from '../../../../../components/registration/SoloPilotRegisterForm';
import { AuthRedirectGuard } from '../../../../../components/auth/AuthRedirectGuard';

export default function RegisterSoloPilotPage() {
  return (
    <AuthRedirectGuard>
      <SoloPilotRegisterForm />
    </AuthRedirectGuard>
  );
}
