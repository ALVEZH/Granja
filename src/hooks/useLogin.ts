// src/hooks/useLogin.ts
import { useState } from 'react';
import { fetchFromDynamicApi } from '../services/dinamicApi';

export const useLogin = () => {
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const resultado = await fetchFromDynamicApi({
        metodo: "ALVEZH_Usuarios",
        tipo: "tabla",
        operacion: "consultar",
        data: {
          where: {
            Estatus: "Activo"
          }
        }
      });

      // Buscar el usuario que tenga tanto el correo como la contraseña en el mismo registro
      const usuario = resultado.find(
        (u: any) =>
          u.Correo === email.trim() &&
          u.PasswordHash === password.trim()
      );

      setLoading(false);
      return usuario ?? null;
    } catch (error) {
      console.error('Error al validar login:', error);
      setLoading(false);
      throw error;
    }
  };

  return { login, loading };
};
