import type { Product, Review } from "../types";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NotFound from "../NotFound";
import "./product-detail.css";
import type { CartItem } from "../types";

export function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [error, setError] = useState(false);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState("");
    const [msg, setMsg] = useState("");

    const addToCartFromDetail = (product: Product): void => {
        const saved = sessionStorage.getItem("cart"); 
        const cart : CartItem[] = saved ? JSON.parse(saved) : [];
        const existingItem = cart.find(item => item.product.id === product.id);
        if (existingItem) {
            if (existingItem.quantity >= product.stock) return;
            sessionStorage.setItem("cart", JSON.stringify(cart.map(item =>
                item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            )));
        } else {
            sessionStorage.setItem("cart", JSON.stringify([...cart, { product, quantity: 1 }]));
        }
    };

    const loadReviews = () => {
        fetch(`http://localhost:3000/api/products/${id}/reviews`)
            .then((res) => res.json())
            .then((data) => setReviews(data))
            .catch((error) => console.error("Error loading reviews:", error));
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
        loadReviews();
    }, [id]);

    const handleSubmitReview = () => {
        if (!id) {
            setMsg("ID de producto no válido");
            return;
        }

        fetch(`http://localhost:3000/api/products/${id}/reviews`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ "rating": newRating, "comment": newComment, "customerId": 1 }),
        })
            .then(async (res) => {
                const data = await res.json().catch(() => null);
                if (!res.ok) {
                    const errorMessage = data?.error || data?.message || `Error ${res.status}`;
                    throw new Error(errorMessage);
                }
                return data;
            })
            .then((data) => {
                setMsg(data?.error ? `${data.error}` : "✔ Reseña enviada");
                if (!data?.error) {
                    setNewComment("");
                    setNewRating(5);
                    loadReviews();
                }
            })
            .catch((error) => {
                console.error("Error submitting review:", error);
                setMsg("Error al enviar la reseña");
            });
    };

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

            {/* Sección de reseñas */}
            <div className="reviews-section">
                <h2>Reseñas ({reviews.length})</h2>
                
                {/* Lista de reseñas */}
                <div className="reviews-list">
                    {reviews.length === 0 ? (
                        <p>No hay reseñas aún. ¡Sé el primero en dejar una!</p>
                    ) : (
                        reviews.map((review) => (
                            <div key={review.id} className="review-card">
                                <div className="review-header">
                                    <strong>{review.customer_name}</strong>
                                    <span className="review-stars">
                                        {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                                    </span>
                                </div>
                                <p className="review-comment">{review.comment}</p>
                                <small className="review-date">{new Date(review.created_at).toLocaleDateString()}</small>
                            </div>
                        ))
                    )}
                </div>

                {/* Formulario de nueva reseña */}
                <div className="review-form">
                    <h3>Deja tu reseña</h3>
                    
                    <div className="form-group">
                        <label htmlFor="rating">Puntuación:</label>
                        <select 
                            id="rating"
                            value={newRating} 
                            onChange={(e) => setNewRating(Number(e.target.value))}
                        >
                            <option value={1}>1 - Muy malo</option>
                            <option value={2}>2 - Malo</option>
                            <option value={3}>3 - Normal</option>
                            <option value={4}>4 - Bueno</option>
                            <option value={5}>5 - Excelente</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="comment">Comentario:</label>
                        <textarea
                            id="comment"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Cuéntanos tu experiencia con este producto..."
                            rows={4}
                        />
                    </div>

                    <button className="submit-review-btn" onClick={handleSubmitReview}>
                        Enviar reseña
                    </button>

                    {msg && <p className={msg.includes("✔") ? "success-msg" : "error-msg"}>{msg}</p>}
                </div>
            </div>
        </div>
    );
}