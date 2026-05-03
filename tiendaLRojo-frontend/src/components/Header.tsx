import { useState } from 'react';
import { useCart } from '../context/CartContext';
import CartSummary from './CartSummary';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Customer } from '../types';

import { useUser } from '../context/UserContext';

function Header() {
  const navigate = useNavigate();
  const { cart, cartCount, updateQuantity, removeFromCart, clearCart } = useCart();
  const { customer, setCustomer } = useUser();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const location = useLocation();

  // No mostrar el header global en la intranet
  if (location.pathname.startsWith('/intranet')) {
    return null;
  }

  const toggleCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCartOpen(!isCartOpen);
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setCustomer(null);
      navigate('/');
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
      // Fallback: al menos limpiar el estado local
      setCustomer(null);
      navigate('/');
    }
  };

  return (
    <>
      <header className="site-header">
        <div className="header-content">
          <div className="header-title">
            <h1 style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>CustomShop</h1>
            <p>Personaliza cualquier objeto</p>
          </div>
          
          <div className="header-info">
            {customer && (
              <div className="user-info">
                <span className="user-name">👤 {customer.username}</span>

                {customer.role === 'customer' && (
                  <button 
                    className="nav-link-btn"
                    onClick={() => navigate('/mis-pedidos')}
                  >
                    Mis pedidos
                  </button>
                )}

                {(customer.role === 'admin' || customer.role === 'employee') && (
                  <button 
                    className="nav-link-btn"
                    onClick={() => navigate('/admin/orders')}
                  >
                    Pedidos
                  </button>
                )}

                {customer.role === 'admin' && (
                  <button 
                    className="nav-link-btn"
                    onClick={() => navigate('/admin/users')}
                  >
                    Usuarios
                  </button>
                )}

                {customer.role === 'employee' && (
                  <button 
                    className="nav-link-btn"
                    onClick={() => navigate('/intranet')}
                  >
                    Panel de empleados
                  </button>
                )}

                <button 
                  className="logout-btn"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
            
            {!customer && (
              <div className="auth-buttons">
                <button 
                  className="login-btn"
                  onClick={() => navigate('/login')}
                >
                  Iniciar sesión
                </button>
                <button 
                  className="register-btn"
                  onClick={() => navigate('/register')}
                >
                  Registrarse
                </button>
              </div>
            )}
            
            <div className="cart-container">
              <button 
                type="button"
                className="cart-toggle-btn" 
                onClick={toggleCart}
                aria-label="Ver carrito"
              >
                <span className="cart-icon">🛒</span>
                {cartCount > 0 && (
                  <span className="counter-badge">{cartCount}</span>
                )}
              </button>

              {isCartOpen && (
                <div className="cart-dropdown">
                  <CartSummary
                    cart={cart}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeFromCart}
                    onConfirm={() => {
                      setIsCartOpen(false);
                      if (customer) {
                        navigate('/checkout');
                      } else {
                        navigate('/login');
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  )
}

export default Header;
