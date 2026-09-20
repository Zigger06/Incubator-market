import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { translations } from '../data/content';
import './Hero.css';

const Hero = () => {
  const { language } = useAppContext();
  const t = translations[language].hero;

  return (
    <section className="hero">
      <div className="hero-content">
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
        <Link to="/products" className="btn-hero">
          {t.cta}
        </Link>
      </div>
      <div className="hero-image">
        <div className="hero-emoji">🥚</div>
      </div>
    </section>
  );
};

export default Hero;
