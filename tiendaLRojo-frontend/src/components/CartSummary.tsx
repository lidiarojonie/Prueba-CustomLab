import { useNavigate } from 'react-router-dom';
import type { CartItem } from '../types';
import './cart.css';

interface CartSummaryProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: number, delta: number) => void;
  onRemove: (productId: number) => void;
  onConfirm: () => void;
}

function CartSummary({ cart, onUpdateQuantity, onRemove, onConfirm }: CartSummaryProps) {
  const navigate = useNavigate();

  const getPrice = (price: number | string): number => {
    return typeof price === 'string' ? parseFloat(price) : price;
  };

  const calculateTotal = (): number => {
    return cart.reduce((total, item) => total + getPrice(item.product.price) * item.quantity, 0);
  };

  const handleConfirm = () => {
    navigate('/checkout');
  };

  return (
    <div className="cart-summary-container">
      <div className="cart-summary-header">
        <h2>Resumen del Carrito</h2>
      </div>

      {cart.length === 0 ? (
        <div className="cart-empty-message">
          <p>El carrito está vacío.</p>
        </div>
      ) : (
        <>
          <div className="cart-items-list">
            {cart.map((item) => (
              <div key={item.product.id} className="cart-summary-item">
                <div className="cart-item-details">
                  <h4>{item.product.name}</h4>
                  <p className="cart-item-price">
                    €{getPrice(item.product.price).toFixed(2)} x {item.quantity} = €{(getPrice(item.product.price) * item.quantity).toFixed(2)}
                  </p>
                </div>

                <div className="cart-item-controls">
                  <button
                    className="cart-quantity-button"
                    onClick={() => onUpdateQuantity(item.product.id, -1)}
                    title="Disminuir cantidad"
                  >
                    −
                  </button>
                  <span className="cart-quantity-display">{item.quantity}</span>
                  <button
                    className="cart-quantity-button"
                    onClick={() => onUpdateQuantity(item.product.id, 1)}
                    title="Aumentar cantidad"
                  >
                    +
                  </button>
                  <button
                    className="cart-remove-button"
                    onClick={() => onRemove(item.product.id)}
                    title="Eliminar del carrito"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary-footer">
            <div className="cart-total">
              <strong>Total:</strong>
              <strong>€{calculateTotal().toFixed(2)}</strong>
            </div>
            <button
              className="cart-checkout-button"
              onClick={handleConfirm}
              disabled={cart.length === 0}
            >
              Ir a pagar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CartSummary;
