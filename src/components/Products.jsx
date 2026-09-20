import React from 'react';
import { useAppContext } from '../context/AppContext';
import { translations, incubators } from '../data/content';
import './Products.css';

const Products = () => {
  const { language, addToCart } = useAppContext();
  const t = translations[language].products;
  const commonT = translations[language].common;

  const handleAddToCart = (product) => {
    if (product.inStock) {
      addToCart(product);
    }
  };

  return (
    <div className="products-page">
      <h1>{t.title}</h1>
      <div className="products-grid">
        {incubators.map((product) => (
          <div key={product.id} className="product-card">
            <div className="product-image">
              <div className="placeholder-image">
                🥚
              </div>
              {!product.inStock && (
                <div className="out-of-stock-badge">{t.outOfStock}</div>
              )}
            </div>
            <div className="product-info">
              <h3>{language === 'tj' ? product.nameTj : product.nameRu}</h3>
              <p className="product-description">
                {language === 'tj' ? product.descriptionTj : product.descriptionRu}
              </p>
              <div className="product-features">
                {product.features.map((feature, index) => (
                  <span key={index} className="feature-tag">{feature}</span>
                ))}
              </div>
              <div className="product-footer">
                <span className="product-price">{product.price} TJS</span>
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={!product.inStock}
                  className={`btn-add-to-cart ${!product.inStock ? 'disabled' : ''}`}
                >
                  {t.addToCart}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Products;
