export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;      // Precio en euros, ej: 19.99
    category: string;
    stock: number;      // Unidades disponibles
    image_url: string;
    active?: boolean;   // Estado del producto (activo/inactivo)
    deleted_at?: string | null;  // Fecha de eliminación lógica
    average_rating?: number | null; // Rating medio del producto (puede ser null si no tiene reseñas)
}

export interface CartItem {
    product: Product;
    quantity: number;
}