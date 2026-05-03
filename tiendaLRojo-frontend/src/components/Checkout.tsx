import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CartItem } from "../types.ts";
import type { Product } from "../types.ts";

function Checkout() {
    const navigate = useNavigate();
    const [cart, setCart] = useState<CartItem[]>(() => {
        const saved = sessionStorage.getItem("cart");
        return saved ? JSON.parse(saved) : [];
    });
    const [address, setAddress] = useState("");

    useEffect(() => {
        sessionStorage.setItem("cart", JSON.stringify(cart));
    }, [cart]);

    const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const handleCheckout = () => {
        if(cart.length === 0) {
            alert("El carrito esta vacio");
            return;
        }
        if(!address){
            alert("Por favor ingrese una direccion de envio");
            return;
        }
        fetch('http://localhost:3000/api/orders', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include',
            body: JSON.stringify({ cart, total })
        })
        .then(res => {
            if (!res.ok) throw new Error("Error del servidor: " + res.status);
            return res.json();
        })
        .then(data => {
            if(data.order){
                alert(`Total a pagar: $${total.toFixed(2)}`);
                setCart([]);
                sessionStorage.removeItem("cart");
                setAddress("");
                navigate("/");
            }
            else{
                alert("Error al procesar la orden");
            }
        
        })
        .catch(error => {
            alert("Error al procesar la orden: " + error.message);
        });
    };

    return (
        <div className="checkout">
            <h2>Carrito de Compras</h2>
            {cart.length === 0 ? (
                <p>El carrito esta vacio</p>
            ) : (
                <>
                <ul className="checkout-list">
                    {cart.map(item => (
                        <li key={item.product.id} className="checkout-item">
                            <span className="checkout-item-name">{item.product.name}</span> 
                            <span className="checkout-item-quantity">Cantidad: {item.quantity}</span>
                            <span className="checkout-item-price">Precio: ${(item.product.price * item.quantity).toFixed(2)}</span>
                        </li>
                    ))}
                </ul>

                <div className="checkout-address">
                    <label htmlFor="address">Direccion de Envio:</label>
                    <input
                        type="text"
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Ingresa tu dirección"
                    />
                </div>
                <div className="checkout-total">Total: <strong>${total.toFixed(2)}</strong></div>
                <button className="checkout-button" onClick={handleCheckout}>
                    Pagar
                </button>
                </>
            )}
        </div>
    );
}    