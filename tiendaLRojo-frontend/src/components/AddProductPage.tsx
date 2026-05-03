import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './admin.css';

function AddProductPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    image_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validaciones básicas
    if (!formData.name || !formData.price || !formData.stock) {
      setError('Por favor, rellena los campos obligatorios (Nombre, Precio, Stock)');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock)
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al crear el producto');
      }

      // alert('Producto añadido con éxito');
      navigate('/intranet/catalogo?success=true');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-container" style={{ maxWidth: '600px' }}>
        <button className="back-btn" onClick={() => navigate('/intranet/catalogo')}>
          ← Volver al catálogo
        </button>
        
        <h2>Añadir Nuevo Producto</h2>
        <p className="admin-subtitle">Completa los datos para añadir un producto a la tienda</p>

        {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label>Nombre del Producto *</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="Ej: Camiseta Algodón Premium"
              required 
            />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              placeholder="Detalles del producto..."
              rows={4}
            />
          </div>

          <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Precio (€) *</label>
              <input 
                type="number" 
                name="price" 
                value={formData.price} 
                onChange={handleChange} 
                step="0.01" 
                placeholder="19.99"
                required 
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Stock Inicial *</label>
              <input 
                type="number" 
                name="stock" 
                value={formData.stock} 
                onChange={handleChange} 
                placeholder="10"
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label>URL de la Imagen</label>
            <input 
              type="text" 
              name="image_url" 
              value={formData.image_url} 
              onChange={handleChange} 
              placeholder="https://ejemplo.com/imagen.jpg"
            />
            <p className="form-hint">Si se deja vacío, se asignará una imagen por defecto</p>
          </div>

          <div className="form-actions" style={{ marginTop: '2rem' }}>
            <button 
              type="submit" 
              className="btn-save" 
              style={{ width: '100%', padding: '1rem' }}
              disabled={loading}
            >
              {loading ? 'Añadiendo...' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProductPage;
