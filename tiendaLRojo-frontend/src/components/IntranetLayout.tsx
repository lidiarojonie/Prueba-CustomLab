import { NavLink, Outlet } from 'react-router-dom';
import './intranet.css';

function IntranetLayout() {
    // Leer el usuario guardado por LoginPage
    const raw = sessionStorage.getItem("user");
    const user = raw ? JSON.parse(raw) : null;

    return (
        <div className="intranet-layout">
            <header className="intranet-header">
                <div className="intranet-header-content">
                    <h1>🏢 Intranet</h1>
                    <span className="intranet-user">
                        Hola, {user?.username ?? "empleado"}
                    </span>
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
