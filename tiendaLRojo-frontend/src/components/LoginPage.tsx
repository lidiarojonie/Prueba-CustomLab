import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './auth.css';
import { useUser } from '../context/UserContext.tsx';

interface LoginFormData {
  identifier: string;
  password: string;
}

function LoginPage() {
  const navigate = useNavigate();
  const { setCustomer } = useUser();
  const [formData, setFormData] = useState<LoginFormData>({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.identifier || !formData.password) {
      setError('Por favor, completa todos los campos');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: formData.identifier, password: formData.password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al iniciar sesión');
      }

      const data = await response.json();
      
      // Guardar usuario en el Context
      setCustomer(data.customer);

      // Redirigir según el dominio del correo
      if (data.customer.email.toLowerCase().endsWith('@empleado.com')) {
        navigate('/intranet');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Iniciar sesión</h1>
        
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="identifier">Email o nombre de usuario:</label>
            <input
              type="text"
              id="identifier"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              placeholder="tu@email.com o usuario"
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={isLoading}
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Cargando...' : 'Entrar'}
          </button>
        </form>

        <div className="auth-footer">
          <p>¿No tienes cuenta? <Link to="/register">Crea una aquí</Link></p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
