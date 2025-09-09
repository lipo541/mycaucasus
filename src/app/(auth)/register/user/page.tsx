import '../register.css';
import { UserRegisterForm } from '../../../../components/registration/UserRegisterForm';

export default function RegisterUserPage() {
  // Render only the inner glass form to keep a single transparent container
  return <UserRegisterForm />;
}
