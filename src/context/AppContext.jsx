import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('incubator_language') || 'tj';
  });
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('incubator_dark_mode');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [currentUser, setCurrentUserState] = useState(null);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    localStorage.setItem('incubator_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('incubator_dark_mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [darkMode]);

  useEffect(() => {
    // Load current user from localStorage
    const storedUser = localStorage.getItem('incubator_current_user');
    if (storedUser) {
      setCurrentUserState(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    // Save cart to localStorage
    localStorage.setItem('incubator_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    // Load cart from localStorage on mount
    const storedCart = localStorage.getItem('incubator_cart');
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
  }, []);

  const setCurrentUser = (user) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem('incubator_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('incubator_current_user');
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const value = {
    language,
    setLanguage,
    darkMode,
    setDarkMode,
    currentUser,
    setCurrentUser,
    logout,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
