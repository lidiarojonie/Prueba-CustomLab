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
import ClockHistory from './components/ClockHistory.tsx';
import AdminUsers from './components/AdminUsers.tsx';
import LoginPage from './components/LoginPage.tsx';
import RegisterPage from './components/RegisterPage.tsx';
import OrderHistory from './components/OrderHistory.tsx';
import OrdersPanel from './components/OrdersPanel.tsx';
import IntranetCatalog from './components/IntranetCatalog.tsx';
import OrderSuccess from './components/OrderSuccess.tsx';
import AddProductPage from './components/AddProductPage.tsx';
import { UserProvider, useUser } from './context/UserContext.tsx';
import PrivateRoute from './components/PrivateRoute.tsx';

function AppContent() {
  const { loading } = useUser();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Iniciando CustomShop...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="product/:id" element={<ProductDetail />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route path="checkout" element={
          <PrivateRoute>
            <CheckoutPage />
          </PrivateRoute>
        } />

        <Route path="/mis-pedidos" element={
          <PrivateRoute>
            <OrderHistory />
          </PrivateRoute>
        } />

        <Route path="/order-success" element={
          <PrivateRoute>
            <OrderSuccess />
          </PrivateRoute>
        } />
        
        <Route path="/intranet" element={
          <PrivateRoute roles={["employee", "admin"]}>
            <IntranetLayout />
          </PrivateRoute>
        }>
          <Route index element={<IntranetHome />} />
          <Route path="fichajes" element={<ClockInPage />} />
          <Route path="pedidos" element={<OrdersPanel />} />
          <Route path="catalogo" element={<IntranetCatalog />} />
          <Route path="catalogo/nuevo" element={<AddProductPage />} />
          <Route path="historico" element={<ClockHistory />} />
        </Route>
        
        <Route path="/admin/users" element={
          <PrivateRoute roles={["admin"]}>
            <AdminUsers />
          </PrivateRoute>
        } />

        <Route path="/admin/orders" element={
          <PrivateRoute roles={["employee", "admin"]}>
            <OrdersPanel />
          </PrivateRoute>
        } />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </UserProvider>
  </StrictMode>,
)
