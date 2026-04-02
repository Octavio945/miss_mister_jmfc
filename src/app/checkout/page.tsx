"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import CheckoutPage from "./CheckoutPage";

export default function CheckoutPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="pt-24 pb-20 min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      }
    >
      <CheckoutPage />
    </Suspense>
  );
}
