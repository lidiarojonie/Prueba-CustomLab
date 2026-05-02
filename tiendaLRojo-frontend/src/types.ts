export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;      // Precio en euros, ej: 19.99
    category: string;
    stock: number;      // Unidades disponibles
    image_url: string;
    average_rating?: number | null; // Rating medio del producto (puede ser null si no tiene reseñas)
}

export interface CartItem {
    product: Product;
    quantity: number;
}

export interface Review {
    id: number;
    product_id: number;
    customer_id: number;
    customer_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

export interface Order {
id: number;
status: string;
total: string; // calculado por el backend con SUM(order_items)
address: string;
created_at: string;
}