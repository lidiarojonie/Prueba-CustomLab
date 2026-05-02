import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext.tsx';

interface ClockEvent {
    id: number;
    type: 'in' | 'out';
    note: string;
    recorded_at: string;
}

interface ClockRecord {
    key: string;
    displayDate: string;
    clockIn: string | null;
    clockOut: string | null;
    noteIn: string;
    noteOut: string;
    complete: boolean;
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('es-ES', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}

function ClockHistory() {
    const { customer: user } = useUser();

    const [records, setRecords] = useState<ClockRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:3000/api/clock/history', {
            credentials: 'include'
        })
            .then(res => res.json())
            .then((events: ClockEvent[]) => {
                // Ordenar cronológicamente (más antiguo primero)
                const sorted = [...events].sort(
                    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
                );

                // Emparejar cada 'in' con su siguiente 'out'
                const pairs: ClockRecord[] = [];
                let pendingIn: ClockEvent | null = null;

                for (const ev of sorted) {
                    if (ev.type === 'in') {
                        // Si ya había un 'in' sin 'out', registrarlo como incompleto
                        if (pendingIn) {
                            pairs.push({
                                key: `in-${pendingIn.id}`,
                                displayDate: formatDate(pendingIn.recorded_at),
                                clockIn: formatTime(pendingIn.recorded_at),
                                clockOut: null,
                                noteIn: pendingIn.note ?? '',
                                noteOut: '',
                                complete: false
                            });
                        }
                        pendingIn = ev;
                    } else {
                        // type === 'out'
                        if (pendingIn) {
                            // Par completo: in + out
                            pairs.push({
                                key: `pair-${pendingIn.id}-${ev.id}`,
                                displayDate: formatDate(pendingIn.recorded_at),
                                clockIn: formatTime(pendingIn.recorded_at),
                                clockOut: formatTime(ev.recorded_at),
                                noteIn: pendingIn.note ?? '',
                                noteOut: ev.note ?? '',
                                complete: true
                            });
                            pendingIn = null;
                        } else {
                            // Salida sin entrada previa
                            pairs.push({
                                key: `out-${ev.id}`,
                                displayDate: formatDate(ev.recorded_at),
                                clockIn: null,
                                clockOut: formatTime(ev.recorded_at),
                                noteIn: '',
                                noteOut: ev.note ?? '',
                                complete: false
                            });
                        }
                    }
                }

                // Si queda un 'in' pendiente al final
                if (pendingIn) {
                    pairs.push({
                        key: `in-${pendingIn.id}`,
                        displayDate: formatDate(pendingIn.recorded_at),
                        clockIn: formatTime(pendingIn.recorded_at),
                        clockOut: null,
                        noteIn: pendingIn.note ?? '',
                        noteOut: '',
                        complete: false
                    });
                }

                // Mostrar los más recientes primero
                pairs.reverse();
                setRecords(pairs);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error cargando histórico:", err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="clock-history">
                <h2>📋 Histórico de fichajes</h2>
                <p>Cargando...</p>
            </div>
        );
    }

    return (
        <div className="clock-history">
            <h2>📋 Histórico de fichajes</h2>

            {records.length === 0 ? (
                <p className="history-empty">No hay fichajes registrados.</p>
            ) : (
                <table className="history-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Entrada</th>
                            <th>Salida</th>
                            <th>Notas</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map(record => (
                            <tr key={record.key} className={record.complete ? 'row-complete' : 'row-incomplete'}>
                                <td className="history-date">{record.displayDate}</td>
                                <td>{record.clockIn ?? '—'}</td>
                                <td>{record.clockOut ?? '—'}</td>
                                <td className="history-notes">
                                    {record.noteIn && <span>🟢 {record.noteIn}</span>}
                                    {record.noteIn && record.noteOut && <br />}
                                    {record.noteOut && <span>🔴 {record.noteOut}</span>}
                                    {!record.noteIn && !record.noteOut && '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default ClockHistory;
