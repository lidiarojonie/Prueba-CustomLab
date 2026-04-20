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
}

export interface CartItem {
    product: Product;
    quantity: number;
}