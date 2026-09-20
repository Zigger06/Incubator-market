import React from 'react';
import { useAppContext } from '../context/AppContext';
import { translations } from '../data/content';

const About = () => {
  const { language } = useAppContext();

  return (
    <div className="about-page" style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '40px', color: 'var(--text-primary)' }}>
        {language === 'tj' ? 'Дар бораи мо' : 'О нас'}
      </h1>
      <div style={{ 
        background: 'var(--bg-primary)', 
        padding: '40px', 
        borderRadius: '12px',
        boxShadow: 'var(--shadow)',
        lineHeight: '1.8',
        color: 'var(--text-secondary)'
      }}>
        <p>
          {language === 'tj' 
            ? 'Ширкати мо дар соҳаи истеҳсоли инкубаторҳо барои паррандапарварӣ солҳо фаъолият дорад. Мо маҳсулоти босифат ва нархҳои дастрас пешниҳод мекунем.'
            : 'Наша компания много лет работает в сфере производства инкубаторов для птицеводства. Мы предлагаем качественную продукцию по доступным ценам.'
          }
        </p>
        <p style={{ marginTop: '20px' }}>
          {language === 'tj'
            ? 'Ҳамаи инкубаторҳои мо бо кафолати 1-2 сол ва хизматрасонии техникӣ таъмин карда мешаванд.'
            : 'Все наши инкубаторы обеспечиваются гарантией 1-2 года и техническим обслуживанием.'
          }
        </p>
      </div>
    </div>
  );
};

export default About;
