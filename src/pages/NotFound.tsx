import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ForwardedLink } from "@/components/ForwardedLink";

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-muted-foreground">404</h1>
        <p className="mb-6 text-xl text-muted-foreground">Halaman tidak ditemukan</p>
        <Button asChild>
          <ForwardedLink to="/">
            <Home className="mr-2 h-4 w-4" />
            Kembali ke Beranda
          </ForwardedLink>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
