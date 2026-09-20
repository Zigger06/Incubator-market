import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import AuthPage from './pages/AuthPage';
import About from './pages/About';
import Contact from './pages/Contact';

function App() {
  return (
    <AppProvider>
      <div className="app">
        <Header />
        <main className="page-container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AppProvider>
  );
}

export default App;
