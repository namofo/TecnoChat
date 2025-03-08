import { useEffect, useState, useMemo } from 'react';
import { Loader2, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useBehaviorStore } from '../../store/behaviorStore';
import { supabase } from '../../lib/supabase';
import type { BehaviorPrompt } from '../../types/database';
import { Switch } from '../../components/ui/Switch';

interface FormDataType extends Omit<BehaviorPrompt, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'embedding'> {
  chatbot_id: string;
  prompt_text: string;
  is_active: boolean;
}

// ...rest of the component following welcome's pattern but adapted for behaviors
He creado dos archivos pata la tabla 'behavior_prompts' es para el promtp para el entrenamiento de la IA 

los dos archivos para el crud son 
store/behaviorStore.ts
pages/behaviors/BehaviorPage.tsx

Aqui se debe implementar el CRUD para la tabla 'behavior_prompts' 