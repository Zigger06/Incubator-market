import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { translations } from '../data/content';
import { validatePhone, validatePin, validatePassword, formatPhone, authStorage } from '../utils/auth';
import './Auth.css';

const Auth = ({ onClose }) => {
  const { language, currentUser, setCurrentUser, logout } = useAppContext();
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [usePin, setUsePin] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const t = translations[language].auth;
  const commonT = translations[language].common;

  const handlePhoneChange = (e) => {
    let value = e.target.value;
    // Auto-format phone number
    if (!value.startsWith('+')) {
      value = '+' + value.replace(/\D/g, '');
    }
    setPhone(value);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate phone
    const formattedPhone = formatPhone(phone);
    if (!validatePhone(formattedPhone)) {
      setError(t.error.invalidPhone);
      return;
    }

    if (isLogin) {
      // Login logic
      const user = authStorage.getUserByPhone(formattedPhone);
      if (!user) {
        setError(t.error.userNotFound);
        return;
      }

      // Check password or PIN
      if (usePin) {
        if (!validatePin(pin)) {
          setError(t.error.invalidPin);
          return;
        }
        if (pin !== user.pin) {
          setError(t.error.wrongPassword);
          return;
        }
      } else {
        if (!validatePassword(password)) {
          setError(t.error.passwordTooShort);
          return;
        }
        if (password !== user.password) {
          setError(t.error.wrongPassword);
          return;
        }
      }

      setCurrentUser(user);
      setSuccess(t.success.loggedIn);
      setTimeout(() => {
        if (onClose) onClose();
      }, 1000);
    } else {
      // Register logic
      const existingUser = authStorage.getUserByPhone(formattedPhone);
      if (existingUser) {
        setError(t.error.userExists);
        return;
      }

      if (usePin) {
        if (!validatePin(pin)) {
          setError(t.error.invalidPin);
          return;
        }
      } else {
        if (!validatePassword(password)) {
          setError(t.error.passwordTooShort);
          return;
        }
      }

      const newUser = {
        id: Date.now(),
        phone: formattedPhone,
        password: usePin ? null : password,
        pin: usePin ? pin : null,
        createdAt: new Date().toISOString()
      };

      authStorage.addUser(newUser);
      setSuccess(t.success.registered);
      
      // Auto-login after registration
      setTimeout(() => {
        setCurrentUser(newUser);
        if (onClose) onClose();
      }, 1000);
    }
  };

  // If user is already logged in, show logout button
  if (currentUser) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h2>{t.loginTitle}</h2>
          <p className="user-phone">{currentUser.phone}</p>
          <button onClick={logout} className="btn-logout">
            {translations[language].nav.logout}
          </button>
          {onClose && (
            <button onClick={onClose} className="btn-close">
              {commonT.cancel}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{isLogin ? t.loginTitle : t.registerTitle}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t.phoneLabel}</label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder={t.phonePlaceholder}
              required
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={usePin}
                onChange={(e) => setUsePin(e.target.checked)}
              />
              {usePin ? t.pinLabel : t.passwordLabel}
            </label>
            <input
              type={usePin ? 'password' : 'password'}
              value={usePin ? pin : password}
              onChange={(e) => usePin ? setPin(e.target.value) : setPassword(e.target.value)}
              placeholder={usePin ? t.pinPlaceholder : t.passwordLabel}
              maxLength={usePin ? 4 : undefined}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" className="btn-submit">
            {isLogin ? t.loginButton : t.registerButton}
          </button>
        </form>

        <div className="auth-switch">
          <button onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? t.switchToRegister : t.switchToLogin}
          </button>
        </div>

        {onClose && (
          <button onClick={onClose} className="btn-close">
            {commonT.cancel}
          </button>
        )}
      </div>
    </div>
  );
};

export default Auth;
