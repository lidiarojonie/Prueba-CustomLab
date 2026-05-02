import { useState } from 'react';
import { useCart } from '../context/CartContext';
import CartSummary from './CartSummary';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  email: string;
  name: string;
  username?: string;
}

function Header() {
  const navigate = useNavigate();
  const { cart, cartCount, updateQuantity, removeFromCart, clearCart } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const toggleCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCartOpen(!isCartOpen);
  };

  // Leer usuario de sessionStorage (esto podría ir a un AuthContext en el futuro)
  const rawUser = sessionStorage.getItem("user");
  const user: User | null = rawUser ? JSON.parse(rawUser) : null;

  return (
    <>
      <header className="site-header">
        <div className="header-content">
          <div className="header-title">
            <h1 style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>CustomShop</h1>
            <p>Personaliza cualquier objeto</p>
          </div>
          
          <div className="header-info">
            {user && (
              <div className="user-info">
                <span className="user-name">👤 {user.username || user.name}</span>
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
                      navigate('/checkout');
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