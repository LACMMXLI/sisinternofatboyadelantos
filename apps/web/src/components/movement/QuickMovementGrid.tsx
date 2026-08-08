import { CupSoda, HandCoins, Tag, UtensilsCrossed } from 'lucide-react';
import { QuickMovementTile } from './QuickMovementTile';

interface QuickMovementGridProps {
  onSelectCategory?: (categoryCode: string) => void;
}

/**
 * Grid 2x2 de categorías más usadas (§4.5, referencia visual 2). El
 * catálogo completo/configurable llega con `MovementCategoriesModule`
 * (Fase 3); aquí se muestran las 4 categorías "system" más frecuentes.
 */
export function QuickMovementGrid({ onSelectCategory }: QuickMovementGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <QuickMovementTile
        label="Adelanto"
        icon={HandCoins}
        tone="danger"
        onClick={() => onSelectCategory?.('CASH_ADVANCE')}
      />
      <QuickMovementTile
        label="Comida"
        icon={UtensilsCrossed}
        tone="warning"
        onClick={() => onSelectCategory?.('FOOD')}
      />
      <QuickMovementTile
        label="Soda"
        icon={CupSoda}
        tone="brand"
        onClick={() => onSelectCategory?.('BEVERAGE')}
      />
      <QuickMovementTile
        label="Otro Descuento"
        icon={Tag}
        tone="purple"
        onClick={() => onSelectCategory?.('OTHER_DEDUCTION')}
      />
    </div>
  );
}
