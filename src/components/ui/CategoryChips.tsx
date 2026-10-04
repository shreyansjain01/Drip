import React from 'react';
import {
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Film,
  HeartPulse,
  Package,
  Plane,
  Plus,
  Coffee,
  HelpCircle
} from 'lucide-react';

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
}

interface CategoryChipsProps {
  categories: CategoryItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAddNew?: () => void;
  className?: string;
}

const iconMap: Record<string, React.ElementType> = {
  Food: Utensils,
  Utensils: Utensils,
  Transport: Car,
  Car: Car,
  Shopping: ShoppingBag,
  ShoppingBag: ShoppingBag,
  Bills: Receipt,
  Receipt: Receipt,
  Entertainment: Film,
  Film: Film,
  Health: HeartPulse,
  HeartPulse: HeartPulse,
  Groceries: Package,
  Package: Package,
  Travel: Plane,
  Plane: Plane,
  Coffee: Coffee,
  Chai: Coffee,
  General: HelpCircle
};

export const CategoryChips: React.FC<CategoryChipsProps> = ({
  categories,
  selectedId,
  onSelect,
  onAddNew,
  className = ''
}) => {
  return (
    <div className={`w-full overflow-x-auto no-scrollbar py-1 px-5 flex items-start gap-3.5 select-none ${className}`}>
      {categories.map((cat) => {
        const isSelected = cat.id === selectedId;
        const IconComponent = iconMap[cat.icon] || iconMap[cat.name] || HelpCircle;

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none cursor-pointer"
          >
            {/* 60x60 rounded-square tile (radius 16) */}
            <div
              className={`w-[60px] h-[60px] rounded-[16px] bg-white flex items-center justify-center text-black transition-all ${
                isSelected
                  ? 'ring-[2.5px] ring-[#B8ACFA] ring-offset-2 ring-offset-black scale-100 shadow-[0_0_15px_rgba(184,172,250,0.35)]'
                  : 'hover:bg-white/95 active:scale-95 shadow-sm'
              }`}
            >
              <IconComponent size={24} strokeWidth={2} />
            </div>

            {/* Label beneath */}
            <span
              className={`text-[12px] font-medium leading-tight transition-colors truncate max-w-[64px] text-center ${
                isSelected ? 'text-[#B8ACFA] font-semibold' : 'text-white/60 group-hover:text-white/80'
              }`}
            >
              {cat.name}
            </span>
          </button>
        );
      })}

      {/* "+ New" category button */}
      {onAddNew && (
        <button
          type="button"
          onClick={onAddNew}
          className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none cursor-pointer"
        >
          <div className="w-[60px] h-[60px] rounded-[16px] bg-[#1A1A1D] border border-dashed border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 active:scale-95 transition-all">
            <Plus size={22} strokeWidth={2} />
          </div>
          <span className="text-[12px] text-white/50 group-hover:text-white/80">
            + New
          </span>
        </button>
      )}
    </div>
  );
};

export default CategoryChips;
