import '../register.css';
import { PilotRegisterForm } from '../../../../components/registration/PilotRegisterForm';

export default function RegisterPilotPage() {
  // Keep CSS import for grid rules, but render only the form card to avoid double containers
  return <PilotRegisterForm />;
}