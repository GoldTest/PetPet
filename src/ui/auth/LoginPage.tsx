import { useState } from 'react';
import { useAuth } from './AuthContext';
import { t } from '../../i18n';

export const LoginPage = () => {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    const { user, error: err } = await (isSignUp ? signUp(email, password) : signIn(email, password));
    if (err) {
      if (err.message?.toLowerCase().includes('email not confirmed')) {
        setError(t('ui.auth.emailNotConfirmed'));
      } else if (err.message?.includes('429') || err.message?.toLowerCase().includes('rate limit')) {
        setError(t('ui.auth.rateLimited'));
      } else if (err.message?.toLowerCase().includes('already registered')) {
        setMessage(t('ui.auth.alreadyRegistered'));
      } else {
        setError(err.message);
      }
    } else if (isSignUp) {
      if (user?.email_confirmed_at) {
        setMessage(t('ui.auth.alreadyRegistered'));
      } else {
        setMessage(t('ui.auth.confirmEmail'));
      }
    }
    setSubmitting(false);
  };

  return (
    <main className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>PetPet</h1>
        <p className="auth-form__subtitle">{t('ui.auth.subtitle')}</p>

        <input
          type="email"
          placeholder={t('ui.auth.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <input
          type="password"
          placeholder={t('ui.auth.passwordPlaceholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
        />

        {error && <p className="auth-form__error">{error}</p>}
        {message && <p className="auth-form__message">{message}</p>}

        <button type="submit" className="primary-button" disabled={submitting}>
          {submitting ? t('ui.auth.submitting') : (isSignUp ? t('ui.auth.signUp') : t('ui.auth.signIn'))}
        </button>

        <button type="button" className="text-button" onClick={() => { setIsSignUp(!isSignUp); setError(''); }}>
          {isSignUp ? t('ui.auth.haveAccount') : t('ui.auth.noAccount')}
        </button>
      </form>
    </main>
  );
};
