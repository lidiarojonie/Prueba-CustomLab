import type { Product } from "../types.ts";

interface ProductCardProps {
    product: Product;
    onSelect?: (id: number) => void;
    onEdit?: (product: Product) => void;
    onDelete?: (id: number) => void;
    onToggle?: (product: Product) => void;
    onAddToCart?: (product: Product) => void;
}

function rating(average_rating : number | null | undefined) : string {
    if (average_rating === null || average_rating === undefined) {
        return "Sin valoraciones";
    }
    const filledStars = Math.round(average_rating);
    return "★".repeat(filledStars) + "☆".repeat(5 - filledStars);
}

function ProductCard({ product, onSelect, onEdit, onDelete, onToggle, onAddToCart }: ProductCardProps) {

    return (
        <div className={`product-card-wrapper ${product.active === false ? 'inactive-product' : ''}`}>
            <div className="product-card" onClick={() => onSelect && onSelect(product.id)}>
                <div className="product-image-container">
                    {onAddToCart && (
                        <button
                            className="btn-add-to-cart"
                            title={product.stock === 0 || product.active === false ? "Producto no disponible" : "Añadir al carrito"}
                            disabled={product.stock === 0 || product.active === false}
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddToCart(product);
                            }}>
                            🛒
                        </button>
                    )}
                    <img src={product.image_url} alt={product.name} />
                    {product.active === false && <div className="disabled-overlay">DESHABILITADO</div>}
                </div>
                <h3>{product.name}</h3>
                <p className="price">{Number(product.price).toFixed(2)} €</p>
                <p className="rating">{rating(product.average_rating)}</p>
                <p className={`stock ${product.stock > 0 ? " in-stock" : "out-of-stock"}`}>
                    {product.stock > 0 ? `En Stock - ${product.stock} unidades` : "Sin Stock - 0 unidades"}
                </p>
            </div>
            {(onEdit || onDelete || onToggle) && (
                <div className="product-actions">
                    {onEdit && (
                        <button 
                            title="Editar stock" 
                            className="btn-edit"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(product);
                            }}>
                            ✏️
                        </button>
                    )}
                    {onToggle && (
                        <button 
                            title={product.active ? "Deshabilitar" : "Habilitar"} 
                            className={product.active ? "btn-disable" : "btn-enable"}
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggle(product);
                            }}>
                            {product.active ? "🚫" : "✅"}
                        </button>
                    )}
                    {onDelete && (
                        <button 
                            title="Borrar" 
                            className="btn-delete"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(product.id);
                            }}>
                            🗑️
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default ProductCard;