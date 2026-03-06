import { Product } from '@/types/product';
import { TrustScore } from './TrustScore';
import { StatusBadge } from './StatusBadge';
import { VerifiedBadge } from './VerifiedBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Building2, Calendar, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  onReport?: () => void;
}

export function ProductCard({ product, onClick, onReport }: ProductCardProps) {
  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        product.isAdminVerified && "ring-1 ring-verified/30"
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl shrink-0 bg-primary/10 text-primary">
            <Package className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              <TrustScore score={product.trustScore} size="sm" showLabel={false} />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Building2 className="w-3.5 h-3.5" />
              <span className="truncate">{product.manufacturer}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={product.status} size="sm" />
              <VerifiedBadge isAdminVerified={product.isAdminVerified} size="sm" />
            </div>

            {product.licenseDate && (
              <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>License: {product.licenseDate}</span>
              </div>
            )}

            {onReport && (
              <div className="mt-3 pt-3 border-t border-border">
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-warning hover:bg-warning/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReport();
                  }}
                >
                  <Flag className="w-3.5 h-3.5 mr-2" />
                  Report Fake Product
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
