import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CheckoutPage.css';

interface OrderItem {
  product_id: number;
  quantity: number;
  price: number | string;
}

interface OrderResponse {
  message: string;
  order: {
    id: number;
    status: string;
    total: string | number;
    created_at: string;
  };
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');


  const getPrice = (price: number | string): number => {
    return typeof price === 'string' ? parseFloat(price) : price;
  };

  const calculateTotal = (): number => {
    return cart.reduce((total, item) => total + getPrice(item.product.price) * item.quantity, 0);
  };

  const handleCompleteOrder = async () => {
    if (!address.trim()) {
      setError('Por favor, indica una dirección de envío');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const orderItems: OrderItem[] = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        price: getPrice(item.product.price)
      }));

      const response = await fetch('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          "items": orderItems,
          "address": address.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Error de validación o de stock
        setError(data.error || 'Error al crear el pedido');
        setIsLoading(false);
        return;
      }

      // Pedido exitoso
      clearCart();
      navigate('/order-success');
    } catch (err) {
      setError('Error de conexión. Por favor, intenta de nuevo.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };



  // Si el carrito está vacío
  if (cart.length === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="empty-cart-message">
            <h2>Carrito vacío</h2>
            <p>No hay productos en tu carrito. Vuelve a la tienda y añade algunos productos.</p>
            <button
              className="checkout-button"
              onClick={() => navigate('/')}
            >
              ← Volver a la tienda
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <h2>Completar compra</h2>
          <button
            className="back-button"
            onClick={() => navigate('/')}
            title="Volver al carrito"
          >
            ← Volver al carrito
          </button>
        </div>

        <div className="checkout-content">
          {/* Resumen del pedido */}
          <div className="order-summary">
            <h3>Resumen del pedido</h3>
            <div className="order-items">
              {cart.map((item) => (
                <div key={item.product.id} className="order-item">
                  <div className="item-info">
                    <p className="item-name">{item.product.name}</p>
                    <p className="item-quantity">
                      Cantidad: <strong>{item.quantity}</strong>
                    </p>
                  </div>
                  <div className="item-price">
                    <p>€{getPrice(item.product.price).toFixed(2)} × {item.quantity}</p>
                    <p className="subtotal">
                      €{(getPrice(item.product.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="order-total-section">
              <div className="total-row">
                <span>Total:</span>
                <span className="total-amount">
                  €{calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Formulario de dirección */}
          <div className="checkout-form">
            <h3>Dirección de envío</h3>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="address">Dirección de envío:</label>
              <textarea
                id="address"
                className="address-input"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setError('');
                }}
                placeholder="Ej: Calle Mayor 12, 3ºA, 28001 Madrid"
                rows={3}
                disabled={isLoading}
              />
              <p className="form-hint">
                Incluye calle, número, piso (si aplica), código postal y ciudad
              </p>
            </div>

            <button
              className="complete-order-button"
              onClick={handleCompleteOrder}
              disabled={!address.trim() || isLoading}
            >
              {isLoading ? 'Procesando...' : 'Completar pedido'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
