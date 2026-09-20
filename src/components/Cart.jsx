import React from 'react';
import { useAppContext } from '../context/AppContext';
import { translations } from '../data/content';
import './Cart.css';

const Cart = () => {
  const { language, cart, removeFromCart, updateCartQuantity, clearCart } = useAppContext();
  const t = translations[language].cart;
  const commonT = translations[language].common;

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <h1>{t.title}</h1>
        <div className="cart-empty">
          <div className="empty-icon">🛒</div>
          <p>{t.empty}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>{t.title}</h1>
      <div className="cart-items">
        {cart.map((item) => (
          <div key={item.id} className="cart-item">
            <div className="cart-item-image">
              <span>🥚</span>
            </div>
            <div className="cart-item-info">
              <h3>{language === 'tj' ? item.nameTj : item.nameRu}</h3>
              <p className="cart-item-price">{item.price} TJS</p>
            </div>
            <div className="cart-item-quantity">
              <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)}>+</button>
            </div>
            <div className="cart-item-total">
              {item.price * item.quantity} TJS
            </div>
            <button 
              onClick={() => removeFromCart(item.id)} 
              className="btn-remove"
              title={t.removeItem}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      
      <div className="cart-summary">
        <div className="summary-row">
          <span>{t.total}</span>
          <span className="summary-total">{total} TJS</span>
        </div>
        <div className="summary-actions">
          <button onClick={clearCart} className="btn-clear">
            {commonT.cancel}
          </button>
          <button className="btn-checkout">
            {t.checkout}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
