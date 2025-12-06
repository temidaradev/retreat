import { Menu, X } from "lucide-react";
import { useState, createContext, useContext, useEffect } from "react";

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

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Burger Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="sm:hidden flex items-center justify-center p-2 rounded-lg transition-all duration-200 relative z-[100]"
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
        <div className="fixed inset-0 z-[9999] sm:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={closeMenu}
            style={{ animationDuration: "200ms" }}
          />

          {/* Menu Panel */}
          <div
            className="absolute top-0 right-0 h-full w-[280px] max-w-[85vw] animate-slide-in-right"
            style={{
              background: "var(--color-bg-primary)",
              borderLeft: "1px solid var(--color-border)",
              boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.4)",
              animationDuration: "250ms",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full flex flex-col overflow-hidden">
              {/* Menu Header */}
              <div
                className="flex items-center justify-between p-4 border-b flex-shrink-0"
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
                  className="p-2 rounded-lg transition-all duration-200"
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
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-3">{children}</div>
                </div>
              </BurgerMenuContext.Provider>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
