import { useEffect, useState } from 'react';
import type { Product } from '../types.ts';
import ProductCard from './ProductCard';
import { useUser } from '../context/UserContext.tsx';
import './admin.css';

function IntranetCatalog() {
  const { customer } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newStock, setNewStock] = useState<string>("");
  
  const loadProducts = () => {
    fetch('http://localhost:3000/api/products')
      .then(response => response.json())
      .then((data: Product[]) => setProducts(data))
      .catch((error) => console.error("Error cargando productos:", error));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setNewStock(product.stock.toString());
  };

  const handleSaveStock = () => {
    if (!editingProduct) return;

    const stockValue = parseInt(newStock);
    if (isNaN(stockValue) || stockValue < 0) {
      alert("El stock debe ser un número mayor o igual a 0");
      return;
    }

    const updatedProduct = { ...editingProduct, stock: stockValue };

    fetch(`http://localhost:3000/api/products/${editingProduct.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(updatedProduct)
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error del servidor: " + res.status);
        return res.json();
      })
      .then(() => {
        setEditingProduct(null);
        loadProducts();
      })
      .catch((error) => {
        console.error("Error actualizando stock:", error);
        alert("Error al actualizar el stock.");
      });
  };

  const handleDelete = (id: number): void => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      return;
    }

    fetch(`http://localhost:3000/api/products/${id}`, {
      method: "DELETE",
      credentials: 'include'
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error del servidor: " + res.status);
        return res.json();
      })
      .then(() => loadProducts())
      .catch((error) => console.error("Error eliminando producto:", error));
  };

  const handleToggle = (product: Product): void => {
    fetch(`http://localhost:3000/api/products/${product.id}/toggle`, {
      method: "PATCH",
      credentials: 'include'
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error del servidor: " + res.status);
        return res.json();
      })
      .then(() => loadProducts())
      .catch((error) => console.error("Error cambiando estado del producto:", error));
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        <h2>🏷️ Gestión del Catálogo</h2>
        <p className="admin-subtitle">Modifica el stock, habilita/deshabilita o elimina productos del catálogo</p>

        <div className='products-grid'>
          {products.map((product) => (
            <ProductCard 
              key={product.id}
              product={product} 
              onEdit={(customer?.role === 'admin' || customer?.role === 'employee') ? handleEditClick : undefined}
              onToggle={(customer?.role === 'admin' || customer?.role === 'employee') ? handleToggle : undefined}
              onDelete={customer?.role === 'admin' ? handleDelete : undefined}
            />
          ))}
        </div>
      </div>

      {editingProduct && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h3>Editar Stock</h3>
            <p>Producto: <strong>{editingProduct.name}</strong></p>
            <div className="modal-form-group">
              <label>Nuevo stock:</label>
              <input 
                type="number" 
                value={newStock} 
                onChange={(e) => setNewStock(e.target.value)}
                min="0"
              />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setEditingProduct(null)}>Cancelar</button>
              <button className="btn-save" onClick={handleSaveStock}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IntranetCatalog;
