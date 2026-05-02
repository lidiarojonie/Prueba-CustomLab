import { useEffect, useState } from 'react';
import './OrderHistory.css';

interface OrderItem {
  name: string;
  image_url: string;
  quantity: number;
  unit_price: number | string;
  subtotal: number | string;
}

interface Order {
  id: number;
  status: string;
  total: number | string;
  address: string;
  created_at: string;
}

interface OrderDetail extends Order {
  items?: OrderItem[];
}

interface User {
  id: number;
  email: string;
  name: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f97316',      // Naranja
  processing: '#3b82f6',   // Azul
  shipped: '#a855f7',      // Morado
  delivered: '#10b981',    // Verde
  cancelled: '#ef4444'     // Rojo
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  processing: 'En proceso',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado'
};

function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState('');

  // Cargar pedidos al montarse
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setIsLoading(true);
        setError('');

        const userStr = sessionStorage.getItem('user');
        if (!userStr) {
          setError('Usuario no autenticado');
          setIsLoading(false);
          return;
        }

        const user: User = JSON.parse(userStr);

        const response = await fetch(`http://localhost:3000/api/orders/customer/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error al cargar pedidos:', err);
        setError('No se pudieron cargar los pedidos. Intenta más tarde.');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  // Cargar detalle de un pedido
  const handleRowClick = async (orderId: number) => {
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(null);
      return;
    }

    try {
      setIsLoadingDetail(true);

      const response = await fetch(`http://localhost:3000/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      const data: OrderDetail = await response.json();
      setSelectedOrder(data);
    } catch (err) {
      console.error('Error al cargar detalle:', err);
      setSelectedOrder(null);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `€${numPrice.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="order-history">
        <div className="order-history-container">
          <h2>Mi historial de pedidos</h2>
          <div className="loading-message">Cargando pedidos...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-history">
        <div className="order-history-container">
          <h2>Mi historial de pedidos</h2>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="order-history">
        <div className="order-history-container">
          <h2>Mi historial de pedidos</h2>
          <div className="empty-message">No hay pedidos todavía.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-history">
      <div className="order-history-container">
        <h2>Mi historial de pedidos</h2>

        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className={`order-row ${selectedOrder?.id === order.id ? 'selected' : ''}`}
                  onClick={() => handleRowClick(order.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="order-id">#{order.id}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: STATUS_COLORS[order.status] }}
                      title={order.status}
                    >
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </td>
                  <td className="order-total">{formatPrice(order.total)}</td>
                  <td className="order-date">{formatDate(order.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detalle del pedido seleccionado */}
        {selectedOrder && !isLoadingDetail && (
          <div className="order-detail">
            <h3>Detalle del pedido #{selectedOrder.id}</h3>

            <div className="detail-header">
              <p>
                <strong>Dirección:</strong> {selectedOrder.address}
              </p>
              <p>
                <strong>Fecha:</strong> {formatDate(selectedOrder.created_at)}
              </p>
            </div>

            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div className="detail-items">
                <h4>Productos</h4>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio unitario</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="item-info">
                            {item.image_url && (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="item-thumbnail"
                              />
                            )}
                            <span>{item.name}</span>
                          </div>
                        </td>
                        <td className="center">{item.quantity}</td>
                        <td className="center">{formatPrice(item.unit_price)}</td>
                        <td className="center">{formatPrice(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="detail-total">
                  <strong>Total del pedido:</strong>
                  <span>{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {isLoadingDetail && (
          <div className="order-detail">
            <p className="loading-message">Cargando detalle...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderHistory;
