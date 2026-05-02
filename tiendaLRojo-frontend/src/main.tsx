import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Header from './components/Header.tsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProductDetail } from './components/ProductDetail.tsx';
import CheckoutPage from './components/CheckoutPage.tsx';
import NotFound from './NotFound.tsx';
import { CartProvider } from './context/CartContext.tsx';
import IntranetLayout from './components/IntranetLayout.tsx';
import IntranetHome from './components/IntranetHome.tsx';
import ClockInPage from './components/ClockInPage.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CartProvider>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="/intranet" element={<IntranetLayout />}>
            <Route index element={<IntranetHome />} />
            <Route path="fichajes" element={<ClockInPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  </StrictMode>,
)
