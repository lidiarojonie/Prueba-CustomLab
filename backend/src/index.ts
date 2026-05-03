import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import type { Product } from "./types.ts";
import { pool } from "./db.ts";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import cookieParser from "cookie-parser";

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET ?? "dinosarioRAWR";

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

interface AuthRequest extends Request {
    customer?: { id: number; username: string; role: string };
}

// Asegurar que la tabla orders tiene customer_id
pool.query(`
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id)
`).catch(() => console.log("Columna customer_id en orders ya existe"));

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    let token = req.cookies.token;

    // Si no hay cookie, buscar en el header Authorization
    if (!token && req.headers.authorization) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({ message: "Acceso no autorizado" });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
        req.customer = { id: payload.id, username: payload.username, role: payload.role };
        next();

    } catch (error) {
        return res.status(403).json({ message: "Token inválido" });
    }
};

const requireRole = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.customer) {
            return res.status(401).json({ message: "Acceso no autorizado" });
        }

        if (!roles.includes(req.customer.role)) {
            return res.status(403).json({ message: "Acceso denegado: permisos insuficientes" });
        }

        next();
    };
};

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

// Asegurar que la columna password existe (renombrar password_hash si es necesario)
pool.query(`
    DO $$ 
    BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='password_hash') THEN
            ALTER TABLE customers RENAME COLUMN password_hash TO password;
        END IF;
    END $$;
`).catch(() => { });

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

app.get("/api/orders", authenticateToken, requireRole("admin", "employee"), async (req: Request, res: Response) => {
    const result = await pool.query(
        "SELECT * FROM orders WHERE created_at IS NOT NULL ORDER BY id ASC");
    res.json(result.rows);
});

app.get("/api/orders/my", authenticateToken, async (req: AuthRequest, res: Response) => {
    const customerId = req.customer!.id;
    const result = await pool.query(
        "SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC",
        [customerId]
    );
    res.json(result.rows);
});

app.get("/api/orders/:id", async (req: Request, res: Response) => {
    const orderId = Number(req.params.id);
    const orderResult = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
    if (orderResult.rows.length === 0) {
        return res.status(404).json({ message: "Pedido no encontrado" });
    }
    const items = await pool.query(
        `SELECT p.name, p.image_url, oi.quantity, oi.unit_price, (oi.quantity * oi.unit_price) as subtotal
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = $1`,
        [orderId]
    );
    res.json({ ...orderResult.rows[0], items: items.rows });
});

app.patch("/api/orders/:id/status", authenticateToken, requireRole("admin", "employee"), async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Estado no válido. Valores permitidos: pending, processing, shipped, delivered, cancelled" });
    }

    try {
        const result = await pool.query(
            "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Pedido no encontrado" });
        }

        res.json({ message: "Estado del pedido actualizado", order: result.rows[0] });
    } catch (error) {
        console.error("Error al actualizar estado del pedido:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
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

// Usar este endpoint de ejemplo para mejorar el resto de endpoints que requieren autenticación, extrayendo el usuario del token y usándolo para personalizar la respuesta o controlar el acceso.
// Añadir producto a la web
app.post("/api/products", authenticateToken, requireRole("admin"), async (req: Request<{}, {}, {
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

app.post("/api/orders", authenticateToken, async (req: AuthRequest, res: Response) => {
    const { items, address } = req.body;
    const customerId = req.customer?.id;
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
        if (Number(productResult.rows[0].price) !== Number(item.price)) {
            return res.status(400).json({ error: `El precio del producto con id ${item.product_id} ha cambiado` });
        }

    }

    const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const orderResult = await client.query(
            "INSERT INTO orders (status, total, address, customer_id) VALUES ('pending', $1, $2, $3) RETURNING *",
            [total, address, customerId]
        );
        const orderId = orderResult.rows[0].id;

        for (const item of items) {
            await client.query(
                "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
                [orderId, item.product_id, item.quantity, item.price]
            );
            await client.query(
                "UPDATE products SET stock = stock - $1, active = CASE WHEN (stock - $1) <= 0 THEN false ELSE active END WHERE id = $2",
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

app.post("/api/products/:id/reviews", async (req: Request<{ id: string }, {}, { rating: number; comment?: string; customerId: number; }>, res: Response) => {

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

app.post("/api/auth/register", async (req: Request<{}, {}, {
    username: string, email: string, password: string, full_name?: string
}>, res: Response) => {
    try {
        const { username, email, password, full_name } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ error: "Username, email y password son requeridos" });
        }

        const existingUser = await pool.query(
            "SELECT 1 FROM customers WHERE username = $1 OR email = $2",
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: "El nombre de usuario o el correo electrónico ya están en uso" });
        }

        let role = 'customer';
        if (email.toLowerCase().endsWith('@empleado.com')) {
            role = 'employee';
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            "INSERT INTO customers (username, email, password, full_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, full_name, role",
            [username, email, hashedPassword, full_name ?? null, role]
        );

        const user = result.rows[0];

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role } as JwtPayload,
            JWT_SECRET,
            { expiresIn: "2h" }
        );

        res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "lax", maxAge: 2 * 60 * 60 * 1000 });
        res.status(201).json({ message: "Usuario registrado e identificado correctamente", customer: user });
    } catch (err) {
        console.error("Error en Registro:", err);
        res.status(500).json({ error: "Error interno del servidor en el registro" });
    }
});

app.get("/api/auth/me", authenticateToken, (req: AuthRequest, res: Response) => {
    res.json({ customer: req.customer });
});

app.post("/api/auth/logout", (req: Request, res: Response) => {
    res.clearCookie("token");
    res.json({ message: "Sesión cerrada correctamente" });
});

app.post("/api/auth/login", async (req: Request<{}, {}, { identifier?: string; email?: string; password: string }>, res: Response) => {
    try {
        const { identifier, email, password } = req.body;
        const loginIdentifier = identifier || email;

        if (!loginIdentifier || !password) {
            return res.status(400).json({ error: "Email/identifier y password son requeridos" });
        }

        const userResult = await pool.query(
            "SELECT id, username, email, password, role FROM customers WHERE email = $1 OR username = $2",
            [loginIdentifier, loginIdentifier]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: "Credenciales inválidas" });
        }

        const user = userResult.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(400).json({ error: "Credenciales inválidas" });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role } as JwtPayload,
            JWT_SECRET,
            { expiresIn: "2h" }
        );

        res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "lax", maxAge: 2 * 60 * 60 * 1000 });
        res.json({
            message: "Login exitoso",
            customer: { id: user.id, username: user.username, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error("Error en Login:", err);
        res.status(500).json({ error: "Error interno del servidor en el login" });
    }
});

// AÑADIR AL DISCO DE CASA A PARTIR DE AQUI
// Modifica, en este caso, todo el producto seleccionado
app.put("/api/products/:id", authenticateToken, requireRole("admin", "employee"), async (req: Request<{ id: string }, {}, {
    name: string; description?: string; price: number;
    category?: string; stock?: number; image_url?: string;
}>, res: Response) => {
    const id = Number(req.params.id);
    const { name, description, price, category, stock, image_url } = req.body;

    const numPrice = Number(price);
    const numStock = Number(stock);

    if (!name) return res.status(400).json({ error: "Nombre es requerido" });
    if (price === undefined || isNaN(numPrice) || numPrice <= 0) {
        return res.status(400).json({ error: "El precio debe ser un número mayor que 0" });
    }
    if (stock !== undefined && (isNaN(numStock) || numStock < 0)) {
        return res.status(400).json({ error: "El stock no puede ser negativo" });
    }

    const finalDescription = description ?? "";
    const finalCategory = category ?? "General";
    const finalStock = numStock || 0;
    const finalImageUrl = image_url ?? `https://placehold.co/200x200?text=${encodeURIComponent(name)}`;
    const isActive = finalStock > 0;

    try {
        const result = await pool.query(
            "UPDATE products SET name = $1, description = $2, price = $3, category = $4, stock = $5, image_url = $6, active = $7 WHERE id = $8 RETURNING *",
            [name, finalDescription, numPrice, finalCategory, finalStock, finalImageUrl, isActive, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        res.json({ message: "Producto actualizado correctamente", product: result.rows[0] });
    } catch (error) {
        console.error("Error en UPDATE /api/products/:id:", error);
        res.status(500).json({ error: "Error al actualizar el producto en la base de datos" });
    }
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

app.delete("/api/products/:id", authenticateToken, requireRole("admin"), async (req, res) => {
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
        return res.json({
            message: "Producto marcado como eliminado",
            product: result.rows[0]
        });
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

app.patch("/api/products/:id/toggle", authenticateToken, requireRole("admin", "employee"), async (req, res) => {
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

// ===========================
// Clock Events (Fichajes)
// ===========================

// Crear tabla clock_events si no existe
pool.query(`
    CREATE TABLE IF NOT EXISTS clock_events (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL,
        type VARCHAR(3) NOT NULL CHECK (type IN ('in', 'out')),
        note TEXT DEFAULT '',
        recorded_at TIMESTAMPTZ DEFAULT NOW()
    )
`).then(() => console.log("Tabla clock_events verificada"))
    .catch(() => console.log("Tabla clock_events ya existe"));

// ¿Tiene fichaje de entrada sin salida?
app.get("/api/clock/status", authenticateToken, requireRole("admin", "employee"), async (req: AuthRequest, res: Response) => {
    const employeeId = req.customer!.id;

    // Buscar el último evento del empleado
    const result = await pool.query(
        `SELECT type FROM clock_events
         WHERE employee_id = $1
         ORDER BY recorded_at DESC
         LIMIT 1`,
        [employeeId]
    );

    // Si el último evento es 'in', está fichado (clocked in)
    const isClockedIn = result.rows.length > 0 && result.rows[0].type === "in";
    res.json({ isClockedIn });
});

// Registrar fichaje (entrada o salida)
app.post("/api/clock", authenticateToken, requireRole("admin", "employee"), async (req: AuthRequest, res: Response) => {
    const employeeId = req.customer!.id;
    const { type, note } = req.body as { type: "in" | "out"; note?: string };

    if (type !== "in" && type !== "out") {
        return res.status(400).json({ error: "type debe ser 'in' o 'out'" });
    }

    const result = await pool.query(
        `INSERT INTO clock_events (employee_id, type, note)
         VALUES ($1, $2, $3)
         RETURNING id, type, recorded_at`,
        [employeeId, type, note ?? ""]
    );

    res.status(201).json({
        message: type === "in" ? "Entrada registrada" : "Salida registrada",
        event: result.rows[0]
    });
});

// Histórico de fichajes de un empleado
app.get("/api/clock/history", authenticateToken, requireRole("admin", "employee"), async (req: AuthRequest, res: Response) => {
    const employeeId = req.customer!.id;

    const result = await pool.query(
        `SELECT id, type, note, recorded_at
         FROM clock_events
         WHERE employee_id = $1
         ORDER BY recorded_at DESC`,
        [employeeId]
    );

    res.json(result.rows);
});

// ===========================
// Admin: Gestión de usuarios
// ===========================

// Asegurar que las columnas role y active existen en customers
pool.query(`
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'customer'
`).catch(() => console.log("Columna role en customers ya existe"));

pool.query(`
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true
`).catch(() => console.log("Columna active en customers ya existe"));

// Listar todos los usuarios
app.get("/api/admin/users", authenticateToken, requireRole("admin"), async (req: Request, res: Response) => {
    const result = await pool.query(
        "SELECT id, username, email, full_name, role, active FROM customers ORDER BY id ASC"
    );
    res.json(result.rows);
});

// Cambiar rol de un usuario
app.patch("/api/admin/users/:id/role", authenticateToken, requireRole("admin"), async (req: Request<{ id: string }, {}, { role: string }>, res: Response) => {
    const id = Number(req.params.id);
    const { role } = req.body;

    const validRoles = ["customer", "employee", "admin"];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Rol inválido. Debe ser: customer, employee o admin" });
    }

    const result = await pool.query(
        "UPDATE customers SET role = $1 WHERE id = $2 RETURNING id, username, email, role, active",
        [role, id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ message: "Rol actualizado", user: result.rows[0] });
});

// Suspender / reactivar usuario
app.patch("/api/admin/users/:id/status", authenticateToken, requireRole("admin"), async (req: Request<{ id: string }, {}, { active: boolean }>, res: Response) => {
    const id = Number(req.params.id);
    const { active } = req.body;

    if (typeof active !== "boolean") {
        return res.status(400).json({ error: "active debe ser un booleano" });
    }

    const result = await pool.query(
        "UPDATE customers SET active = $1 WHERE id = $2 RETURNING id, username, email, role, active",
        [active, id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
        message: active ? "Usuario reactivado" : "Usuario suspendido",
        user: result.rows[0]
    });
});