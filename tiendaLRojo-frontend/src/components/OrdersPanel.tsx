import { useEffect, useState } from 'react';
import './OrderHistory.css';
import './admin.css';

interface Order {
    id: number;
    status: string;
    total: number | string;
    address: string;
    customer_id: number;
    created_at: string;
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

function OrdersPanel() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3000/api/orders', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setOrders(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error al cargar pedidos:', err);
            setError('No se pudieron cargar los pedidos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const handleStatusChange = async (orderId: number, newStatus: string) => {
        try {
            const response = await fetch(`http://localhost:3000/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                throw new Error('Error al actualizar el estado');
            }

            // Actualizar localmente
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (err) {
            console.error('Error al actualizar estado:', err);
            alert('No se pudo actualizar el estado del pedido.');
        }
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatPrice = (price: number | string): string => {
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        return `€${numPrice.toFixed(2)}`;
    };

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-container">
                    <h2>📦 Gestión de Pedidos</h2>
                    <div className="loading-message">Cargando pedidos...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-container">
                <h2>📦 Gestión de Pedidos</h2>
                <p className="admin-subtitle">{orders.length} pedido(s) en total</p>

                {error && <div className="error-message">{error}</div>}

                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Cliente ID</th>
                                <th>Estado</th>
                                <th>Total</th>
                                <th>Dirección</th>
                                <th>Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id}>
                                    <td className="order-id">#{order.id}</td>
                                    <td>{order.customer_id}</td>
                                    <td>
                                        <select
                                            className="role-select"
                                            value={order.status}
                                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                            style={{ 
                                                color: STATUS_COLORS[order.status],
                                                fontWeight: 'bold',
                                                borderColor: STATUS_COLORS[order.status]
                                            }}
                                        >
                                            {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                                <option key={value} value={value} style={{ color: STATUS_COLORS[value] }}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="order-total">{formatPrice(order.total)}</td>
                                    <td>
                                        <div style={{ maxWidth: '200px', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.address}>
                                            {order.address}
                                        </div>
                                    </td>
                                    <td className="order-date">{formatDate(order.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default OrdersPanel;
