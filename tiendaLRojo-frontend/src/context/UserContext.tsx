import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface Customer {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface UserContextType {
  customer: Customer | null;
  setCustomer: (customer: Customer | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/auth/me', {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setCustomer(data.customer);
        } else {
          setCustomer(null);
        }
      } catch (err) {
        console.error("Error verificando sesión:", err);
        setCustomer(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  return (
    <UserContext.Provider value={{ customer, setCustomer, loading, setLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
