import { useEffect, useState } from 'react';
import type { Product } from './types.ts';
import type { CartItem } from './types.ts';
import ProductCard from './components/ProductCard';
import { useNavigate } from 'react-router-dom';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:3000/api/products')
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((error) => console.error("Error:", error));
  }, []);

  // Actualizar desde aqui
  const loadProducts = () => {
    fetch('http://localhost:3000/api/products')
      .then(response => response.json())
      .then((data: Product[]) => setProducts(data))
      .catch((error) => console.error("Error ", error));
  };

  const handleUpdateStock = (product: Product): void => {
    const input = window.prompt(`Stock actual: ${product.stock}. Nuevo stock: `);
    if (input === null) return;

    const newStock = parseInt(input);

    if (isNaN(newStock) || newStock < 0) {
      alert("El stock en debe ser un numero mayor o igual a 0");
      return;
    }

    const updatedProduct = { ...product, stock: newStock };

    fetch(`http://localhost:3000/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify(updatedProduct)
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error del servidor: " + res.status);
        return res.json();
      })
      .then(() => loadProducts())
      .catch((error) => console.error("Error: ", error));

  };
  // Hasta aqui

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newProduct = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: Number(formData.get('price')),
      category: formData.get('category'),
      stock: Number(formData.get('stock')),
      image_url: formData.get('imageUrl')
    };

    fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct)
    })
      .then(res => res.json())
      .then(data => {
        if (data.products) {
          setProducts(prev => [...prev, data.products]);
          (e.target as HTMLFormElement).reset();
        }
      })
      .catch(error => console.error("Error al añadir producto:", error));
  };

  const handleDelete = (id: number): void => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      return;
    }

    fetch(`http://localhost:3000/api/products/${id}`, {
      method: "DELETE"
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error del servidor: " + res.status);
        return res.json();
      })
      .then(() => loadProducts())
      .catch((error) => console.error("Error: ", error));
  };

  const addToCart = (product: Product): void => {
    setCart(prev => {
      const existing = prev.find(
        i => i.product.id === product.id
      );
      if (existing) {
        if (existing.quantity >= product.stock)
          return prev;
        return prev.map(i => 
          i.product.id === product.id
          ? { ...i, quantity: i.quantity + 1}
          :i
        );
      }

      return [...prev, {product, quantity: 1}]
    });
  };

  return (
    <>
      <div className='formulario-producto'>
        <h3>Añadir producto</h3>
        <form onSubmit={handleSubmit} className="form-horizontal">
          <div className="form-group">
            <label htmlFor="name">Nombre:</label>
            <input type="text" id="name" name="name" required />
          </div>
          <div className="form-group">
            <label htmlFor="description">Descripción:</label>
            <input type="text" id="description" name="description" />
          </div>
          <div className="form-group">
            <label htmlFor="price">Precio:</label>
            <input type="number" step="0.01" id="price" name="price" required />
          </div>
          <div className="form-group">
            <label htmlFor="category">Categoría:</label>
            <input type="text" id="category" name="category" />
          </div>
          <div className="form-group">
            <label htmlFor="stock">Stock:</label>
            <input type="number" id="stock" name="stock" />
          </div>
          <div className="form-group">
            <label htmlFor="imageUrl">Imagen:</label>
            <input type="text" id="imageUrl" name="imageUrl" />
          </div>
          <div className="form-group form-actions">
            <button type="submit">Añadir</button>
          </div>
        </form>
      </div>

      {/* Actualizar a partir de aqui */}
      <div className='products-grid'>
        {products.map((product) => (
          <ProductCard 
            key={product.id}
            product={product} 
            onSelect={(id) => navigate(`product/${id}`)}
            onEdit={handleUpdateStock}
            onDelete={handleDelete}
            onAddToCart={addToCart}
          />
        ))}
      </div>
    </>
  )
}


export default App;
