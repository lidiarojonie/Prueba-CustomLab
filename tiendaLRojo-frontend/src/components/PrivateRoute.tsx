import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  roles?: string[];
}

export default function PrivateRoute({ children, roles }: Props) {
  const { customer, loading } = useUser();

  // Si aún se está verificando la sesión, mostrar carga
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  // Si no hay usuario autenticado, redirigir al login
  if (!customer) {
    return <Navigate to="/login" replace />;
  }

  // Si se especificaron roles, comprobar que el usuario tiene uno de ellos
  if (roles && !roles.includes(customer.role)) {
    return <Navigate to="/" replace />;
  }

  // Si todo va bien, renderizar los hijos
  return <>{children}</>;
}
