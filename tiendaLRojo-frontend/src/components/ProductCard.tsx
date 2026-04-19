import type { Product } from "../types.ts";

interface ProductCardProps {
    product: Product;
    onSelect?: (id: number) => void;
}

function ProductCard({ product, onSelect }: ProductCardProps) {

    return (
        <>
            <div className="product-card" onClick={() => onSelect && onSelect(product.id)}>
                <img src={product.image_url} alt={product.name} />
                <h3>{product.name}</h3>
                <p className="price">{Number(product.price).toFixed(2)} €</p>
                <p className={`stock ${product.stock > 0 ? " in-stock" : "out-of-stock"}`}>
                    {product.stock > 0 ? `En Stock - ${product.stock} unidades` : "Sin Stock - 0 unidades"}
                </p>
            </div>

        </>
    );
}

export default ProductCard;