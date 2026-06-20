import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { MapPin, LayoutDashboard, Plus, LogOut, User as UserIcon, Menu } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { user, signOut, isAuthority, loading } = useAuth();
  const [open, setOpen] = useState(false);

  const navLinks = (
    <>
      <Link to="/carte" className="text-sm font-medium hover:text-secondary transition-colors" onClick={() => setOpen(false)}>
        Carte
      </Link>
      <Link to="/signalements" className="text-sm font-medium hover:text-secondary transition-colors" onClick={() => setOpen(false)}>
        Signalements
      </Link>
      {isAuthority && (
        <Link to="/tableau-de-bord" className="text-sm font-medium hover:text-secondary transition-colors" onClick={() => setOpen(false)}>
          Tableau de bord
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-primary text-primary-foreground border-b border-primary/40 backdrop-blur">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground font-display font-bold">
            BT
          </div>
          <div className="hidden sm:block">
            <div className="font-display font-bold text-base leading-tight">BATIR TCHAD</div>
            <div className="text-[10px] uppercase tracking-wider opacity-70 leading-tight">Plateforme citoyenne</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">{navLinks}</nav>

        <div className="hidden md:flex items-center gap-2">
          {loading ? null : user ? (
            <>
              <Button asChild size="sm" variant="secondary">
                <Link to="/signaler"><Plus className="h-4 w-4 mr-1" />Signaler</Link>
              </Button>
              <Button asChild size="sm" variant="ghost" className="text-primary-foreground hover:bg-primary/60">
                <Link to="/profil"><UserIcon className="h-4 w-4" /></Link>
              </Button>
              <Button size="sm" variant="ghost" className="text-primary-foreground hover:bg-primary/60" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost" className="text-primary-foreground hover:bg-primary/60">
                <Link to="/auth">Se connecter</Link>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link to="/auth" search={{ mode: "signup" } as never}>S'inscrire</Link>
              </Button>
            </>
          )}
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-primary/40 px-4 py-4 flex flex-col gap-4 bg-primary">
          {navLinks}
          {user ? (
            <>
              <Link to="/signaler" className="text-sm font-medium" onClick={() => setOpen(false)}>+ Nouveau signalement</Link>
              <Link to="/profil" className="text-sm font-medium" onClick={() => setOpen(false)}>Mon profil</Link>
              <button className="text-sm font-medium text-left" onClick={() => { setOpen(false); signOut(); }}>Se déconnecter</button>
            </>
          ) : (
            <Link to="/auth" className="text-sm font-medium" onClick={() => setOpen(false)}>Se connecter / S'inscrire</Link>
          )}
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t bg-muted/40">
      <div className="container mx-auto px-4 py-8 text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>BATIR TCHAD — Construisons ensemble notre nation</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/carte" className="hover:text-foreground">Carte</Link>
          <Link to="/signalements" className="hover:text-foreground">Signalements</Link>
          <span aria-hidden>·</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}

// re-export for convenience
export { LayoutDashboard };
