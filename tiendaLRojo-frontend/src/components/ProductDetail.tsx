import type { Product } from "../types";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NotFound from "../NotFound";
import "./product-detail.css";

export function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [error, setError] = useState(false);

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
        <div className="product-detail">
            <button className="back-button" onClick={() => navigate("/")}>← Volver</button>
            <br />
            <img src={product.imageUrl} alt={product.name} />
            <h3>{product.name}</h3>
            {product.description && <p className="description">{product.description}</p>}
            <p className="price">{product.price.toFixed(2)} €</p>
            <p className={`stock ${product.stock > 0 ? "in-stock" : "out-of-stock"}`}>
                {product.stock > 0 ? `En Stock - ${product.stock} unidades` : "Sin Stock - 0 unidades"}
            </p>
        </div>
    );
}