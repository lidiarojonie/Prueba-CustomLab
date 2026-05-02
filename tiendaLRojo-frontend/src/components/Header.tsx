import type { CartItem } from '../types';

interface User {
  id: number;
  email: string;
  name: string;
  username?: string;
}

function Header() {
  // Leer carrito de sessionStorage
  const rawCart = sessionStorage.getItem("cart");
  const cart: CartItem[] = rawCart ? JSON.parse(rawCart) : [];
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Leer usuario de sessionStorage
  const rawUser = sessionStorage.getItem("user");
  const user: User | null = rawUser ? JSON.parse(rawUser) : null;

  return (
    <>
      <header className="site-header">
        <div className="header-content">
          <div className="header-title">
            <h1>CustomShop</h1>
            <p>Personaliza cualquier objeto</p>
          </div>
          
          <div className="header-info">
            {user && (
              <div className="user-info">
                <span className="user-name">👤 {user.username || user.name}</span>
              </div>
            )}
            
            {cartCount > 0 && (
              <div className="cart-counter">
                <span className="counter-badge">{cartCount}</span>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  )
}

export default Header;