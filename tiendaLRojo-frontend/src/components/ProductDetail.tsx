import type { Product } from "../types";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cart from './cart';
import NotFound from "../NotFound";
import "./product-detail.css";
import type { CartItem } from "../types";

export function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [error, setError] = useState(false);

    const addToCartFromDetail = (product: Product): void => {
        const saved = sessionStorage.getItem("cart"); 
        const cart : CartItem[] = saved ? JSON.parse(saved) : [];
        const existingItem = cart.find(item => item.product.id === product.id);
        if (existingItem) {
            if (existingItem.quantity >= product.stock) return;
            sessionStorage.setItem("cart", JSON.stringify(cart.map(item => {
                item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            })));
        } else {
            sessionStorage.setItem("cart", JSON.stringify([...cart, { product, quantity: 1 }]));
        }
    };

    useEffect(() => {
        fetch(`http://localhost:3000/api/products/${id}`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Product not found");
                }
                return res.json();
            })
            .then((data) => setProduct(data))
            .catch((error) => {
                console.error("Error:", error);
                setError(true);
            });
    }, [id]);

    if (error) {
        return <NotFound />;
    }

    if (!product) {
        return <div>Cargando...</div>;
    }

    
    return (
        <div className="product-detail-container">
            <div className="product-detail">
                <button className="back-button" onClick={() => navigate("/")}>← Volver</button>
                <img src={product.image_url} alt={product.name} />
                <h3>{product.name}</h3>
                {product.description && <p className="description">{product.description}</p>}
                <p className="price">{Number(product.price).toFixed(2)} €</p>
                <p className={`stock ${product.stock > 0 ? "in-stock" : "out-of-stock"}`}>
                    {product.stock > 0 ? `En Stock - ${product.stock} unidades` : "Sin Stock - 0 unidades"}
                </p>

                <button className="add-to-cart-button" onClick={() => addToCartFromDetail(product)} disabled={product.stock === 0}>
                    Añadir al carrito
                </button>
            </div>
        </div>
    );
}