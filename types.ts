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

export interface GameState {
  score: number;
  heldItem: IngredientType | null;
  activeIngredients: ThrownIngredient[];
  lastMessage: string;
}

export const INGREDIENT_COLORS = {
  [IngredientType.BUN]: '#FCD34D', // Amber-300
  [IngredientType.SAUSAGE]: '#EF4444', // Red-500
};