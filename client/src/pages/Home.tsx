import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, LogIn, UtensilsCrossed } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (isScanning) {
      scanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          // Assuming the QR code contains the tableToken or a full URL
          // If it's a full URL, we extract the token. For now, let's assume it's the token.
          let token = decodedText;
          if (decodedText.includes("/menu/")) {
            token = decodedText.split("/menu/")[1];
          }
          
          if (scanner) {
            scanner.clear().catch(error => console.error("Failed to clear scanner", error));
          }
          setIsScanning(false);
          setLocation(`/menu/${token}`);
        },
        (error) => {
          // silent error for scan failures
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(error => console.error("Failed to clear scanner on unmount", error));
      }
    };
  }, [isScanning, setLocation]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <UtensilsCrossed className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">
            Cafeteria System
          </CardTitle>
          <p className="text-slate-500 mt-2">Welcome! Please choose an option to continue.</p>
        </CardHeader>
        
        <CardContent className="space-y-4 pt-6">
          {!isScanning ? (
            <>
              <Button 
                onClick={() => setIsScanning(true)}
                className="w-full h-20 text-lg font-semibold flex items-center justify-center gap-3 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
                variant="default"
              >
                <QrCode className="w-6 h-6" />
                Scan QR / Barcode
              </Button>

              <Button 
                onClick={() => setLocation("/dashboard/manager")}
                className="w-full h-20 text-lg font-semibold flex items-center justify-center gap-3 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                variant="outline"
              >
                <LogIn className="w-6 h-6" />
                Login
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div id="qr-reader" className="overflow-hidden rounded-xl border-2 border-primary/20 bg-slate-100"></div>
              <Button 
                onClick={() => setIsScanning(false)}
                variant="ghost" 
                className="w-full py-6 text-slate-600 font-medium"
              >
                Cancel Scanning
              </Button>
            </div>
          )}
        </CardContent>
        
        <div className="p-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Cafeteria Management System
        </div>
      </Card>
    </div>
  );
}
