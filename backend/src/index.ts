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

app.get("/api/products", async (req: Request, res: Response) => {
    const result = await pool.query(
        "SELECT * FROM products WHERE deleted_at IS NULL ORDER BY id ASC");
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