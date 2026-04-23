import { useState } from 'react';
import type { CartItem } from '../types';
import './cart.css';

interface CartProps {
  cart: CartItem[];
  onRemoveFromCart: (productId: number) => void;
  onClearCart: () => void;
}

function Cart({ cart, onRemoveFromCart, onClearCart }: CartProps) {
  const [showCart, setShowCart] = useState(false);

  const calculateCartTotal = (): number => {
    return cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  };

  return (
    <div className="cart-summary">
      <button className="cart-toggle-button" onClick={() => setShowCart((prev) => !prev)}>
        Carrito ({cart.length})
      </button>

      {showCart && (
        <div className="cart-dropdown">
          <h3>Carrito ({cart.length} {cart.length === 1 ? 'producto' : 'productos'})</h3>

          {cart.length === 0 ? (
            <p className="cart-empty">El carrito está vacío</p>
          ) : (
            <>
              <ul>
                {cart.map((item) => (
                  <li key={item.product.id} className="cart-item">
                    <div>
                      <strong>{item.product.name}</strong>
                      <p>Cantidad: {item.quantity}</p>
                      <p>Precio: €{(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <button className="cart-item-remove" onClick={() => onRemoveFromCart(item.product.id)}>
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>

              <div className="cart-footer">
                <p className="cart-total">Total: €{calculateCartTotal().toFixed(2)}</p>
                <button className="cart-clear-button" onClick={onClearCart}>
                  Vaciar carrito
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Cart;
