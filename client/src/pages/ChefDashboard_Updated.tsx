import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTranslation } from "@/locales/useTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, ChevronUp } from "lucide-react";

interface OrderItemWithTiming {
  id: string;
  menuItemId: string;
  quantity: number;
  status: string;
  sentToKitchenAt: Date;
  readyAt?: Date;
  elapsedTime: string;
  preparationTime?: string;
}

export default function ChefDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { language, setLanguage } = useTranslation();
  const staffId = (user as any)?.id || "";
  const cafeteriaId = (user as any)?.cafeteriaId || "";

  const [elapsedTimes, setElapsedTimes] = useState<Record<string, string>>({});
  const [preparationTimes, setPreparationTimes] = useState<Record<string, string>>({});
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Handle scroll to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch kitchen orders
  const { data: kitchenOrders, isLoading: ordersLoading, refetch } = trpc.orders.getOrders.useQuery(
    { cafeteriaId, status: "open" },
    { enabled: !!cafeteriaId, refetchInterval: 3000 }
  );

  // Update elapsed times every second
  useEffect(() => {
    const interval = setInterval(() => {
      const newElapsedTimes: Record<string, string> = {};
      const newPreparationTimes: Record<string, string> = {};

      if (kitchenOrders) {
        kitchenOrders.forEach((order: any) => {
          order.items.forEach((item: any) => {
            if (item.sentToKitchenAt) {
              const now = new Date();
              const sentTime = new Date(item.sentToKitchenAt);
              const diffMs = now.getTime() - sentTime.getTime();
              const diffMins = Math.floor(diffMs / 60000);
              const diffSecs = Math.floor((diffMs % 60000) / 1000);
              newElapsedTimes[item.id] = diffMins > 0 ? `${diffMins}m ${diffSecs}s` : `${diffSecs}s`;

              // Calculate preparation time if ready
              if (item.readyAt) {
                const prepMs = new Date(item.readyAt).getTime() - sentTime.getTime();
                const prepMins = Math.floor(prepMs / 60000);
                const prepSecs = Math.floor((prepMs % 60000) / 1000);
                newPreparationTimes[item.id] = prepMins > 0 ? `${prepMins}m ${prepSecs}s` : `${prepSecs}s`;
              }
            }
          });
        });
      }

      setElapsedTimes(newElapsedTimes);
      setPreparationTimes(newPreparationTimes);
    }, 1000);

    return () => clearInterval(interval);
  }, [kitchenOrders]);

  const updateItemStatusMutation = trpc.orders.updateItemStatus.useMutation({
    onSuccess: () => refetch()
  });

  const markAsReady = async (itemId: string) => {
    try {
      // Call mutation to mark item as ready
      await updateItemStatusMutation.mutateAsync({ orderItemId: itemId, newStatus: "ready" });
    } catch (error) {
      console.error("Failed to mark item as ready:", error);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const isRTL = language === 'ar';

  return (
    <div className={`min-h-screen bg-gray-50 p-2 md:p-8 pb-20 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-3 md:px-4 py-3 md:py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm mb-6 rounded-lg">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate">Chef Dashboard</h1>
        </div>
        <select 
          value={language} 
          onChange={(e) => setLanguage(e.target.value as 'ar' | 'en')}
          className="px-2 py-1 md:px-3 md:py-2 text-xs md:text-sm border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-blue-400 transition-colors flex-shrink-0"
        >
          <option value="en">EN</option>
          <option value="ar">AR</option>
        </select>
      </header>

      <div className="max-w-7xl mx-auto">
        {/* Subtitle */}
        <div className="mb-4 md:mb-6">
          <p className="text-gray-600 text-sm md:text-base">Manage kitchen orders and track preparation time</p>
        </div>

        {ordersLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin" />
          </div>
        ) : !kitchenOrders || kitchenOrders.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600">No orders in kitchen</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6 auto-rows-max">
            {kitchenOrders.map((order: any) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 md:space-y-4">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="p-3 md:p-4 border rounded-lg bg-gray-50">
                        {/* Item Header */}
                        <div className="flex justify-between items-start mb-2 md:mb-3 gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm md:text-base">Item {item.menuItemId}</p>
                            <p className="text-xs md:text-sm text-gray-600">Qty: {item.quantity}</p>
                          </div>
                          <Badge variant={item.status === "ready" ? "default" : "secondary"} className="text-xs md:text-sm py-1 px-2 flex-shrink-0">
                            {item.status.replace(/_/g, " ")}
                          </Badge>
                        </div>

                        {/* Timing Information */}
                        <div className="grid grid-cols-2 gap-2 md:gap-3 mb-2 md:mb-3 p-2 md:p-3 bg-white rounded border border-gray-200">
                          <div>
                            <p className="text-[10px] md:text-xs text-gray-600">Elapsed</p>
                            <p className="text-base md:text-lg font-bold text-blue-600">{elapsedTimes[item.id] || "0s"}</p>
                          </div>
                          {item.readyAt && (
                            <div>
                              <p className="text-[10px] md:text-xs text-gray-600">Prep</p>
                              <p className="text-base md:text-lg font-bold text-green-600">{preparationTimes[item.id] || "0s"}</p>
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        {item.notes && (
                          <div className="mb-2 md:mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs md:text-sm">
                            <p className="text-gray-700"><strong>Notes:</strong> {item.notes}</p>
                          </div>
                        )}

                        {/* Action Button */}
                        {item.status !== "ready" && (
                          <Button
                            onClick={() => markAsReady(item.id)}
                            className="w-full py-2 md:py-3 text-sm md:text-base font-bold active:scale-95 transition-transform"
                            variant="default"
                          >
                            Mark as Ready
                          </Button>
                        )}
                        {item.status === "ready" && (
                          <div className="w-full p-2 md:p-3 bg-green-100 border border-green-300 rounded text-center text-green-700 font-semibold text-sm md:text-base">
                            ✓ Ready for Pickup
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Floating Scroll-to-Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-blue-600 hover:bg-blue-700 text-white p-3 md:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 active:scale-95"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 md:w-6 h-5 md:h-6" />
        </button>
      )}
    </div>
  );
}
