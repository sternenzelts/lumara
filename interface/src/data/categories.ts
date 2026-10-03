import { Flame, Heart, Sparkles, WandSparkles } from 'lucide-react';
import type { FragmentCategory } from '../backend/types';

export const CATEGORIES: { id: FragmentCategory; label: string; plain: string; icon: typeof Sparkles }[] = [
  { id: 'radiance', label: 'Radiance', plain: 'Keep', icon: Heart },
  { id: 'fracture', label: 'Fracture', plain: 'Problem', icon: Flame },
  { id: 'spark', label: 'Spark', plain: 'Try', icon: WandSparkles },
  { id: 'wildcard', label: 'Wildcard', plain: 'Anything else', icon: Sparkles },
];
