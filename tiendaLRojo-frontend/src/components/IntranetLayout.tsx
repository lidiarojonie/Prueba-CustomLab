import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext.tsx';
import './intranet.css';

function IntranetLayout() {
    const { customer: user, setCustomer } = useUser();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await fetch('http://localhost:3000/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            setCustomer(null);
            navigate('/');
        } catch (err) {
            console.error("Error al cerrar sesión:", err);
            setCustomer(null);
            navigate('/');
        }
    };

    return (
        <div className="intranet-layout">
            <header className="intranet-header">
                <div className="intranet-header-content">
                    <h1>🏢 Intranet</h1>
                    
                    <div className="user-info">
                        <span className="user-name">👤 {user?.username ?? "empleado"}</span>
                        <button className="logout-btn" onClick={handleLogout}>
                            Cerrar sesión
                        </button>
                    </div>
                </div>
                <nav className="intranet-nav">
                    <NavLink
                        to="/intranet"
                        end
                        className={({ isActive }) => isActive ? "intranet-nav-link active" : "intranet-nav-link"}
                    >
                        Bienvenida
                    </NavLink>
                    <NavLink
                        to="/intranet/fichajes"
                        className={({ isActive }) => isActive ? "intranet-nav-link active" : "intranet-nav-link"}
                    >
                        Fichajes
                    </NavLink>
                    <NavLink
                        to="/intranet/pedidos"
                        className={({ isActive }) => isActive ? "intranet-nav-link active" : "intranet-nav-link"}
                    >
                        Pedidos
                    </NavLink>
                    <NavLink
                        to="/intranet/catalogo"
                        className={({ isActive }) => isActive ? "intranet-nav-link active" : "intranet-nav-link"}
                    >
                        Catálogo
                    </NavLink>
                    <NavLink
                        to="/intranet/historico"
                        className={({ isActive }) => isActive ? "intranet-nav-link active" : "intranet-nav-link"}
                    >
                        Histórico
                    </NavLink>
                </nav>
            </header>

            <main className="intranet-content">
                <Outlet />
            </main>
        </div>
    );
}

export default IntranetLayout;
