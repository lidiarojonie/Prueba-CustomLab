import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext.tsx';

interface ClockEvent {
    id: number;
    type: string;
    recorded_at: string;
}

function ClockInPage() {
    const { customer: user } = useUser();

    const [isClockedIn, setIsClockedIn] = useState(false);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [confirmation, setConfirmation] = useState<{ message: string; time: string } | null>(null);

    // Consultar estado actual al montarse
    useEffect(() => {
        fetch('http://localhost:3000/api/clock/status', {
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                setIsClockedIn(data.isClockedIn);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error consultando estado de fichaje:", err);
                setLoading(false);
            });
    }, []);

    const handleClock = async () => {
        setSubmitting(true);
        setConfirmation(null);

        try {
            const type = isClockedIn ? "out" : "in";
            const response = await fetch('http://localhost:3000/api/clock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ type, note })
            });

            const data: { message: string; event: ClockEvent } = await response.json();

            if (!response.ok) {
                alert("Error al registrar fichaje");
                setSubmitting(false);
                return;
            }

            // Actualizar estado del botón
            setIsClockedIn(type === "in");
            // Vaciar textarea
            setNote('');
            // Mostrar confirmación con la hora
            const hora = new Date(data.event.recorded_at).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            setConfirmation({
                message: type === "in" ? "Entrada registrada" : "Salida registrada",
                time: hora
            });
        } catch (err) {
            console.error("Error:", err);
            alert("Error de conexión al registrar fichaje");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="clockin-page">
                <h2>⏱️ Fichajes</h2>
                <p>Cargando estado...</p>
            </div>
        );
    }

    return (
        <div className="clockin-page">
            <h2>⏱️ Fichajes</h2>
            <p className="clockin-status">
                Estado actual: {isClockedIn
                    ? <span className="status-in">✅ Fichaje de entrada activo</span>
                    : <span className="status-out">⏸️ Sin fichaje activo</span>
                }
            </p>

            <div className="clockin-form">
                <label htmlFor="clockNote">Incidencia (opcional):</label>
                <textarea
                    id="clockNote"
                    className="clockin-textarea"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Escribe una incidencia si la hay..."
                    rows={3}
                    disabled={submitting}
                />

                <button
                    className={`clockin-button ${isClockedIn ? 'clock-out' : 'clock-in'}`}
                    onClick={handleClock}
                    disabled={submitting}
                >
                    {submitting
                        ? 'Registrando...'
                        : isClockedIn
                            ? '🔴 Fichar salida'
                            : '🟢 Fichar entrada'
                    }
                </button>
            </div>

            {confirmation && (
                <div className="clockin-confirmation">
                    <p><strong>{confirmation.message}</strong></p>
                    <p>Hora registrada: {confirmation.time}</p>
                </div>
            )}
        </div>
    );
}

export default ClockInPage;
