import { useEffect, useState } from 'react';
import './admin.css';

interface User {
    id: number;
    username: string;
    email: string;
    full_name: string | null;
    role: string;
    active: boolean;
}

function AdminUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const loadUsers = () => {
        fetch('http://localhost:3000/api/admin/users', {
            credentials: 'include'
        })
            .then(res => res.json())
            .then((data: User[]) => {
                setUsers(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error cargando usuarios:", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleRoleChange = async (userId: number, newRole: string) => {
        try {
            const res = await fetch(`http://localhost:3000/api/admin/users/${userId}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ role: newRole })
            });
            if (res.ok) {
                setUsers(prev => prev.map(u =>
                    u.id === userId ? { ...u, role: newRole } : u
                ));
            } else {
                alert("Error al cambiar el rol");
            }
        } catch {
            alert("Error de conexión");
        }
    };

    const handleToggleStatus = async (userId: number, currentActive: boolean) => {
        try {
            const res = await fetch(`http://localhost:3000/api/admin/users/${userId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ active: !currentActive })
            });
            if (res.ok) {
                setUsers(prev => prev.map(u =>
                    u.id === userId ? { ...u, active: !currentActive } : u
                ));
            } else {
                alert("Error al cambiar el estado");
            }
        } catch {
            alert("Error de conexión");
        }
    };

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-container">
                    <h2>👥 Gestión de Usuarios</h2>
                    <p>Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-container">
                <h2>👥 Gestión de Usuarios</h2>
                <p className="admin-subtitle">
                    {users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}
                </p>

                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className={!user.active ? 'row-suspended' : ''}>
                                    <td>{user.id}</td>
                                    <td className="user-name-cell">
                                        {user.full_name || user.username}
                                        <span className="user-username">@{user.username}</span>
                                    </td>
                                    <td>{user.email}</td>
                                    <td>
                                        <select
                                            className="role-select"
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                        >
                                            <option value="customer">Customer</option>
                                            <option value="employee">Employee</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${user.active ? 'active' : 'suspended'}`}>
                                            {user.active ? 'Activo' : 'Suspendido'}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className={`action-btn ${user.active ? 'btn-suspend' : 'btn-reactivate'}`}
                                            onClick={() => handleToggleStatus(user.id, user.active)}
                                        >
                                            {user.active ? 'Suspender' : 'Reactivar'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default AdminUsers;
