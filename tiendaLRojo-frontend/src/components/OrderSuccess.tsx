import { useNavigate } from 'react-router-dom';
import './OrderSuccess.css';

function OrderSuccess() {
  const navigate = useNavigate();

  return (
    <div className="order-success-page">
      <button 
        className="back-to-catalog-btn"
        onClick={() => navigate('/')}
      >
        ← Volver al catálogo
      </button>

      <div className="success-card">
        <div className="success-icon">✨</div>
        <h1>¡Gracias por tu pedido!</h1>
        <p>Estamos procesando tu compra y te enviaremos una actualización muy pronto.</p>
        <div className="success-footer">
          <p>Puedes ver el estado de tus compras en tu historial.</p>
          <button className="view-orders-btn" onClick={() => navigate('/mis-pedidos')}>
            Ver mis pedidos
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;
