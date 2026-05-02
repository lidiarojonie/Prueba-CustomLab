import { useNavigate } from 'react-router-dom';

function IntranetHome() {
    const navigate = useNavigate();

    // Leer el usuario guardado por LoginPage
    const raw = sessionStorage.getItem("user");
    const user = raw ? JSON.parse(raw) : null;

    return (
        <div className="intranet-home">
            <div className="welcome-card">
                <h2>👋 ¡Bienvenido/a, {user?.username ?? "empleado"}!</h2>
                <p>
                    Esta es la zona privada de la empresa. Desde aquí puedes gestionar
                    tus fichajes y consultar tu historial de actividad.
                </p>
                <button
                    className="intranet-action-button"
                    onClick={() => navigate('/intranet/fichajes')}
                >
                    ⏱️ Ir a Fichajes
                </button>
            </div>
        </div>
    );
}

export default IntranetHome;
