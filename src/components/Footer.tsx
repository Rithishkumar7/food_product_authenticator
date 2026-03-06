import { Shield, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-display font-bold">TrustVerify</span>
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            Protecting consumers through FSSAI-based food product authentication.
          </p>
          
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-danger fill-danger" /> for food safety
          </p>
        </div>
        
        <div className="mt-6 pt-6 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground">
            © 2024 TrustVerify. This is an academic project using mock data for demonstration purposes.
          </p>
        </div>
      </div>
    </footer>
  );
}
