export enum IngredientType {
  BUN = 'BUN',
  SAUSAGE = 'SAUSAGE'
}

export interface ThrownIngredient {
  id: string;
  type: IngredientType;
  position: [number, number, number];
  velocity: [number, number, number];
}

export interface PlateState {
  hasBun: boolean;
  hasSausage: boolean;
}

export interface GameState {
  score: number;
  heldItem: IngredientType | null;
  activeIngredients: ThrownIngredient[];
  plate: PlateState;
  lastMessage: string;
  completedCount: number;
  gameWon: boolean;
}

export const INGREDIENT_COLORS = {
  [IngredientType.BUN]: '#FCD34D', // Amber-300
  [IngredientType.SAUSAGE]: '#EF4444', // Red-500
};