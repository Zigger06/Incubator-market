import React from 'react';
import { useAppContext } from '../context/AppContext';
import { translations } from '../data/content';
import './Footer.css';

const Footer = () => {
  const { language } = useAppContext();
  const t = translations[language].footer;

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>🥚 IncubatorShop</h3>
          <p>Инкубаторҳои касбӣ барои паррандапарварӣ</p>
        </div>
        
        <div className="footer-section">
          <h4>Тамос</h4>
          <p>{t.phone}</p>
          <p>{t.email}</p>
        </div>
        
        <div className="footer-section">
          <h4>Иттилоот</h4>
          <p>© 2024 IncubatorShop</p>
          <p>{t.rights}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
