"use client";

import * as React from "react";

export type MarketingConversionContextValue = {
  openComparePlans: () => void;
};

export const MarketingConversionContext = React.createContext<MarketingConversionContextValue | null>(
  null
);

export function useMarketingConversion() {
  const ctx = React.useContext(MarketingConversionContext);
  if (!ctx) {
    throw new Error("useMarketingConversion must be used within marketing layout chrome");
  }
  return ctx;
}
