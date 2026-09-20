import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { translations } from '../data/content';
import './Header.css';

const Header = () => {
  const { language, setLanguage, darkMode, setDarkMode, currentUser, cart, logout } = useAppContext();
  const [showAuth, setShowAuth] = useState(false);
  const t = translations[language];

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          🥚 IncubatorShop
        </Link>

        <nav className="nav">
          <Link to="/">{t.nav.home}</Link>
          <Link to="/products">{t.nav.products}</Link>
          <Link to="/about">{t.nav.about}</Link>
          <Link to="/contact">{t.nav.contact}</Link>
        </nav>

        <div className="header-actions">
          {/* Language Switcher */}
          <button 
            onClick={() => setLanguage(language === 'tj' ? 'ru' : 'tj')}
            className="btn-lang"
          >
            {language === 'tj' ? 'TJ' : 'RU'}
          </button>

          {/* Dark Mode Toggle */}
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="btn-theme"
            title={darkMode ? t.common.lightMode : t.common.darkMode}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* Cart */}
          <Link to="/cart" className="btn-cart">
            🛒
            {cartItemsCount > 0 && (
              <span className="cart-count">{cartItemsCount}</span>
            )}
          </Link>

          {/* Auth */}
          {currentUser ? (
            <div className="user-menu">
              <span className="user-phone">{currentUser.phone}</span>
              <button onClick={logout} className="btn-logout-small">
                {t.nav.logout}
              </button>
            </div>
          ) : (
            <Link to="/auth" className="btn-auth">
              {t.nav.login}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
