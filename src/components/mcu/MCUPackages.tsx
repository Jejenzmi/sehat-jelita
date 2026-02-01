import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMCUData } from "@/hooks/useMCUData";
import { Check } from "lucide-react";

export function MCUPackages() {
  const { packages, loadingPackages } = useMCUData();

  if (loadingPackages) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "basic":
        return "border-gray-200";
      case "standard":
        return "border-blue-200";
      case "executive":
        return "border-purple-200";
      case "comprehensive":
        return "border-amber-200";
      default:
        return "border-gray-200";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {packages?.map((pkg: any) => (
        <Card key={pkg.id} className={`border-2 ${getCategoryColor(pkg.category)}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline">{pkg.package_code}</Badge>
              <Badge className="capitalize">{pkg.category}</Badge>
            </div>
            <CardTitle className="text-lg mt-2">{pkg.package_name}</CardTitle>
            <p className="text-sm text-muted-foreground">{pkg.description}</p>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-4">
              {formatCurrency(Number(pkg.base_price))}
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Termasuk:</p>
              {pkg.mcu_package_items?.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  <span>{item.item_name}</span>
                </div>
              ))}
              {pkg.mcu_package_items?.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  +{pkg.mcu_package_items.length - 5} item lainnya
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )) || (
        <div className="col-span-full text-center py-8 text-muted-foreground">
          Tidak ada paket MCU tersedia
        </div>
      )}
    </div>
  );
}
