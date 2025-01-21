/*
  # Crear tabla de contactos y configurar seguridad

  1. Nueva Tabla
    - `contacts`
      - `id` (uuid, clave primaria)
      - `user_id` (uuid, referencia a auth.users)
      - `nombre` (text)
      - `telefono` (text)
      - `fecha` (date)
      - `imagen` (text, URL de la imagen)
      - `created_at` (timestamp con zona horaria)

  2. Seguridad
    - Habilitar RLS en la tabla `contacts`
    - Políticas para que los usuarios solo puedan:
      - Ver sus propios contactos
      - Crear nuevos contactos
      - Actualizar sus propios contactos
      - Eliminar sus propios contactos
*/

-- Crear la tabla de contactos
CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  nombre text NOT NULL,
  telefono text NOT NULL,
  fecha date NOT NULL,
  imagen text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Política para ver solo los propios contactos
CREATE POLICY "Users can view own contacts" ON contacts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política para crear contactos
CREATE POLICY "Users can create contacts" ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política para actualizar propios contactos
CREATE POLICY "Users can update own contacts" ON contacts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para eliminar propios contactos
CREATE POLICY "Users can delete own contacts" ON contacts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Función para actualizar el timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar el timestamp
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();