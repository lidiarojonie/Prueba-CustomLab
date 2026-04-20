export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;      // Precio en euros, ej: 19.99
    category: string;
    stock: number;      // Unidades disponibles
    image_url: string;
}

export interface CartItem {
    product: Product;
    quantity: number;
}