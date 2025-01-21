/*
  # Crear tabla de clientes

  1. Nueva Tabla
    - `clients`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `nombre` (text)
      - `telefono` (text)
      - `email` (text)
      - `fecha` (date)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Seguridad
    - Habilitar RLS en la tabla `clients`
    - Políticas para que los usuarios solo puedan ver y manipular sus propios clientes
*/

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  nombre text NOT NULL,
  telefono text NOT NULL,
  email text NOT NULL,
  fecha date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Política para ver solo los propios clientes
CREATE POLICY "Users can view own clients" ON clients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política para crear clientes
CREATE POLICY "Users can create clients" ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política para actualizar propios clientes
CREATE POLICY "Users can update own clients" ON clients
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para eliminar propios clientes
CREATE POLICY "Users can delete own clients" ON clients
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger para actualizar el timestamp
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();