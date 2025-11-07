import { Menu, X } from "lucide-react";
import { useState, createContext, useContext } from "react";

interface BurgerMenuContextType {
  closeMenu: () => void;
}

const BurgerMenuContext = createContext<BurgerMenuContextType | null>(null);

export const useBurgerMenu = () => {
  const context = useContext(BurgerMenuContext);
  return context;
};

interface BurgerMenuProps {
  children: React.ReactNode;
}

export default function BurgerMenu({ children }: BurgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Burger Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="sm:hidden flex items-center justify-center p-2 rounded-lg hover-lift transition-all duration-200"
        style={{
          background: "var(--color-bg-secondary)",
          color: "var(--color-text-primary)",
        }}
        aria-label="Menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[9998] sm:hidden"
            onClick={closeMenu}
          />

          {/* Menu Panel */}
          <div
            className="fixed top-0 right-0 h-full w-72 shadow-xl z-[9999] sm:hidden animate-slide-in-right overflow-y-auto"
            style={{
              background: "var(--color-bg-primary)",
              borderLeft: "1px solid var(--color-border)",
            }}
          >
            {/* Menu Header */}
            <div
              className="flex items-center justify-between p-4 border-b sticky top-0 z-[9999]"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-bg-primary)",
              }}
            >
              <span
                className="text-lg font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Menu
              </span>
              <button
                onClick={closeMenu}
                className="p-2 rounded-lg hover-lift transition-all duration-200"
                style={{
                  background: "var(--color-bg-secondary)",
                  color: "var(--color-text-primary)",
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Items */}
            <BurgerMenuContext.Provider value={{ closeMenu }}>
              <div className="p-4 space-y-3">{children}</div>
            </BurgerMenuContext.Provider>
          </div>
        </>
      )}
    </>
  );
}
