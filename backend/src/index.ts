import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import type { Product } from "./types.ts";
import { pool } from "./db.ts";

const app = express();
const PORT = 3000;

const products: Product[] = [
    { id: 1, name: "Camiseta Unboxing", description: "Camiseta negra con diseño retro de unboxing.", price: 19.99, category: "Ropa", stock: 50, image_url: "https://placehold.co/200x200?text=Camiseta" },
    { id: 2, name: "Taza Bug Hunter", description: "Taza blanca con mensaje para programadores.", price: 12.50, category: "Cocina", stock: 30, image_url: "https://placehold.co/200x200?text=Taza" },
    { id: 3, name: "Funda Dark Mode", description: "Funda para móvil con diseño minimalista.", price: 15.00, category: "Accesorios", stock: 20, image_url: "https://placehold.co/200x200?text=Funda" },
    { id: 4, name: "Sudadera npm ci", description: "Sudadera gris con eslogan de desarrollo.", price: 35.00, category: "Ropa", stock: 15, image_url: "https://placehold.co/200x200?text=Sudadera" },
    { id: 5, name: "Sticker Pack Dev", description: "Set de 10 stickers con iconos tech.", price: 5.99, category: "Papelería", stock: 100, image_url: "https://placehold.co/200x200?text=Stickers" }
];

app.use(cors());
app.use(express.json());

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

app.get("/", (req: Request, res: Response) => {
    res.send("Backend de la tienda funcionando")
});

app.get("/api/hello", (req: Request, res: Response) => {
    res.json({ message: "Hola desde el backend" })
});

// Además, modifica el endpoint existente GET /api/products para que devuelva también el rating medio de cada producto
//(puede ser null si no tiene reseñas).
app.get("/api/products", async (req: Request, res: Response) => {
    const result = await pool.query(
        `SELECT p.*, AVG(r.rating) as average_rating
        FROM products p
        LEFT JOIN reviews r ON p.id = r.product_id
        WHERE p.deleted_at IS NULL
        GROUP BY p.id
        ORDER BY p.id ASC`);
    res.json(result.rows);
});

app.get("/api/products/inactive", async (req: Request, res: Response) => {
    const result = await pool.query(
        "SELECT * FROM products WHERE active = false AND deleted_at IS NULL ORDER BY id ASC");
    res.json(result.rows);
});

app.get("/api/products/:id", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
    
    if (result.rows.length === 0) {
        return res.status(404).json({ message: "Producto no encontrado" });
    }
    res.json(result.rows[0]);
});

app.get("/api/test", async (req: Request, res: Response) => {
    const result = await pool.query("SELECT NOW()");
    res.json({ connected: true, time: result.rows[0].now });
});

app.get("/api/pedidos", async (req: Request, res: Response) => {
    const result = await pool.query(
        "SELECT * FROM orders WHERE created_at IS NOT NULL ORDER BY id ASC");
    res.json(result.rows);
});

app.get("/api/pedidos/:id", async (req: Request, res: Response) => {
    const orderId = Number(req.params.id);
    const orderResult = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
    if (orderResult.rows.length === 0) {
        return res.status(404).json({ message: "Pedido no encontrado" });
    }
    const items = await pool.query(
        `SELECT p.id, p.name, p.price FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = $1`, 
        [orderId]
    );
    res.json({... orderResult.rows[0], items: items.rows });
});

app.get("/api/products/:id/reviews", async (req: Request, res: Response) => {
    const productId = Number(req.params.id);
    const result = await pool.query(
        `SELECT r.id, r.rating, r.comment, r.created_at, c.username AS customer_name
        FROM reviews r
        JOIN customers c ON r.customer_id = c.id
        WHERE r.product_id = $1
        ORDER BY r.created_at DESC`,
        [productId]
    );
    res.json(result.rows);
});

// Añadir producto a la web
app.post("/api/products", async (req: Request<{}, {}, {
    name: string; description?: string; price: number;
    category?: string; stock?: number; image_url?: string;
}>, res: Response) => {
    const { name, description, price, category, stock, image_url } = req.body;
    if (!name) return res.status(400).json({ error: "Nombre es requerido" });
    if (price === undefined || price <= 0) {
        return res.status(400).json({ error: "El precio debe ser mayor que 0" });
    }
    if (stock !== undefined && stock < 0) {
        return res.status(400).json({ error: "El stock no puede ser negativo" })
    }

    const finalDescription = description ?? "";
    const finalCategory = category ?? "General";
    const finalStock = stock ?? 0;
    const finalImageUrl = image_url ?? `https://placehold.co/200x200?text=${encodeURIComponent(name)}`;

    const result = await pool.query(
        "INSERT INTO products (name, description, price, category, stock, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [name, finalDescription, price, finalCategory, finalStock, finalImageUrl]
    );

    res.status(201).json({ message: "producto añadido correctamente", product: result.rows[0] });
});

app.post("/api/orders", async (req: Request<{}, {}, {
    items: { product_id: number; quantity: number; price: number }[];
    address: string;
}>, res: Response) => {
    const { items, address } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Se requiere un array de items con product_id y quantity" });
    }
    if (!address) {
        return res.status(400).json({ error: "La dirección de envío es requerida" });
    }

    for (const item of items) {
        if (!item.product_id || item.quantity <= 0 || item.price <= 0) {
            return res.status(400).json({ error: "Cada item debe tener un product_id numérico, una quantity mayor que 0 y un price mayor que 0" });
        }

        const productResult = await pool.query(
            "SELECT stock, price FROM products WHERE id = $1 AND deleted_at IS NULL",
            [item.product_id]
        );
        if (productResult.rows.length === 0) {
            return res.status(400).json({ error: `Producto con id ${item.product_id} no encontrado` });
        }
        if (productResult.rows[0].stock < item.quantity) {
            return res.status(400).json({ error: `Stock insuficiente para producto id ${item.product_id}` });
        }
        if (productResult.rows[0].price !== item.price) {
            return res.status(400).json({ error: `El precio del producto con id ${item.product_id} ha cambiado` });
        }
        
    }

    const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    const client = await pool.connect();

    try {
        await pool.query("BEGIN");

        const orderResult = await pool.query(
            "INSERT INTO orders (status, total, address) VALUES ('pending', $1, $2) RETURNING *",
            [total, address]
        );
        const orderId = orderResult.rows[0].id;

        for (const item of items) {
            await client.query(
                "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
                [orderId, item.product_id, item.quantity, item.price]
            );
            await client.query(
                "UPDATE products SET stock = stock - $1 WHERE id = $2",
                [item.quantity, item.product_id]
            );
        }

        await client.query("COMMIT");
        res.status(201).json({ message: "Pedido creado correctamente", orderId });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error al crear pedido:", error);
        res.status(500).json({ error: "Error al crear el pedido" });
    } finally {
        client.release();
    }
});

app.post("/api/products/:id/reviews", async (req: Request<{ id: string }, {}, {rating: number; comment?: string; customerId: number;}>, res: Response) => {

    const productId = Number(req.params.id);
    const { rating, comment, customerId } = req.body;
    if (rating === undefined || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating debe ser un número entre 1 y 5" });
    }
    const commentText = comment ?? "";

    const productResult = await pool.query( 
        "SELECT id FROM products WHERE id = $1 AND deleted_at IS NULL",
        [productId]
    );
    if (productResult.rows.length === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
    }
    
    const customerResult = await pool.query(
        "SELECT id FROM customers WHERE id = $1",
        [customerId]
    );
    if (customerResult.rows.length === 0) {
        return res.status(404).json({ error: "Cliente no encontrado" });
    }

    const result = await pool.query(
        "INSERT INTO reviews (product_id, customer_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *",
        [productId, customerId, rating, commentText]
    );
    res.status(201).json({ message: "Reseña creada correctamente", review: result.rows[0] });
});

// AÑADIR AL DISCO DE CASA A PARTIR DE AQUI
// Modifica, en este caso, todo el producto seleccionado
app.put("/api/products/:id", async (req: Request<{ id: string }, {}, {
    name: string; description?: string; price: number;
    category?: string; stock?: number; image_url?: string;
}>, res: Response) => {
    const id = Number(req.params.id);
    const { name, description, price, category, stock, image_url } = req.body;

    if (!name) return res.status(400).json({ error: "Nombre es requerido" });
    if (price === undefined || price <= 0) {
        return res.status(400).json({ error: "El precio debe ser mayor que 0" });
    }
    if (stock !== undefined && stock < 0) {
        return res.status(400).json({ error: "El stock no puede ser negativo" });
    }

    const finalDescription = description ?? "";
    const finalCategory = category ?? "General";
    const finalStock = stock ?? 0;
    const finalImageUrl = image_url ?? `https://placehold.co/200x200?text=${encodeURIComponent(name)}`;

    const result = await pool.query(
        "UPDATE products SET name = $1, description = $2, price = $3, category = $4, stock = $5, image_url = $6 WHERE id = $7 RETURNING *",
        [name, finalDescription, price, finalCategory, finalStock, finalImageUrl, id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ message: "Producto actualizado correctamente", product: result.rows[0] });
});

// Hard delete, elimina completamente el producto de la base de datos. 
// No se recomienda en producción, pero es útil para pruebas y desarrollo.
// Elimina un producto mediante la id en la url
/*
app.delete("/api/products/:id", async (req: Request<{ id: string }>, res: Response) => {
    const id = Number(req.params.id);

    const result = await pool.query("DELETE FROM products WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ message: "Producto eliminado", product: result.rows[0] });
});
*/

// Soft delete, marca el producto como eliminado sin eliminarlo físicamente de la base de datos. 
// Esto permite mantener un historial y evitar problemas de integridad referencial.

app.delete("/api/products/:id", async (req, res) => {
    const inOrders = await pool.query(
        "SELECT 1 FROM order_items WHERE product_id = $1 LIMIT 1", 
        [Number(req.params.id)]
    );

    if (inOrders.rows.length > 0) {
        const result = await pool.query(
            "UPDATE products SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING *", 
            [Number(req.params.id)]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Producto no encontrado o ya eliminado" });
        }
        return res.json({ message: "Producto marcado como eliminado", 
            product: result.rows[0] });
    }
    
    // Si no está en ningún pedido, se puede eliminar físicamente
    // Añadir el Hard delete como opción para productos que no estén en pedidos
    const id = Number(req.params.id);

    const result = await pool.query("DELETE FROM products WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ message: "Producto eliminado", product: result.rows[0] });
});

app.patch("/api/products/:id/toggle", async (req, res) => {
    const result = await pool.query(
        "UPDATE products SET active = NOT active WHERE id = $1 AND deleted_at IS NULL RETURNING *",
        [Number(req.params.id)]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: "Producto no encontrado o eliminado" });
    }

    const p = result.rows[0];

    res.json({ 
        message: p.active ? "Producto activado" : "Producto desactivado", 
        product: p 
    });
});