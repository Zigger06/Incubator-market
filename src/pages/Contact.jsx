import React from 'react';
import { useAppContext } from '../context/AppContext';
import { translations } from '../data/content';

const Contact = () => {
  const { language } = useAppContext();
  const t = translations[language].footer;

  return (
    <div className="contact-page" style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '40px', color: 'var(--text-primary)' }}>
        {language === 'tj' ? 'Тамос' : 'Контакты'}
      </h1>
      <div style={{ 
        background: 'var(--bg-primary)', 
        padding: '40px', 
        borderRadius: '12px',
        boxShadow: 'var(--shadow)'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>
            {language === 'tj' ? 'Маълумоти тамос' : 'Контактная информация'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
            {t.phone}<br />
            {t.email}
          </p>
        </div>
        <div>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>
            {language === 'tj' ? 'Сӯҳбати онлайн' : 'Онлайн чат'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
            {language === 'tj'
              ? 'Барои сӯҳбати онлайн бо мо, лутфан ба WhatsApp ё Telegram паём фиристед.'
              : 'Для онлайн-чата с нами, пожалуйста, напишите в WhatsApp или Telegram.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contact;
