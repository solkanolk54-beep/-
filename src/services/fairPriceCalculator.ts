/**
 * خوارزمية احتساب السعر العادل وهوامش الربح القانونية
 * منظومة كَرِيمَة للرقابة الشاملة والشفافية الرقمية
 * 
 * Formula:
 * Fair Price = Farm Gate Price + Calculated Logistics Cost + Wholesale Margin + Retail Margin Cap
 */

export interface PriceCalculationParams {
  farmGatePrice: number;        // سعر الخروج من المزرعة (دج/كلغ)
  distanceKm: number;           // مسافة النقل (كم)
  dieselPricePerLiter?: number; // سعر المازوت المرجعي (دج/لتر)
  requiresColdChain?: boolean;  // تبريد لوجستي مستمر
  wholesaleMarginPct?: number;  // هامش ربح سوق الجملة (%)
  retailMarginPct?: number;     // أقصى هامش ربح تجزئة مرخص (%)
  packagingPerKg?: number;      // تكلفة الصناديق والتغليف (دج/كلغ)
}

export interface PriceBreakdownResult {
  farmGatePrice: number;
  logisticsCostPerKg: number;
  packagingCostPerKg: number;
  subtotalBeforeWholesale: number;
  wholesaleMarginAmount: number;
  fairWholesaleCeiling: number;
  retailMarginAmount: number;
  fairRetailCeiling: number;
  statusAgainstObserved: (observedPrice: number) => {
    status: 'fair' | 'warning' | 'gouging';
    deltaPct: number;
    excessAmountDzd: number;
    labelAr: string;
    descriptionAr: string;
  };
}

export function calculateFairPrice(params: PriceCalculationParams): PriceBreakdownResult {
  const {
    farmGatePrice,
    distanceKm,
    dieselPricePerLiter = 29.0, // Benchmark Algerian Subsidized Diesel
    requiresColdChain = false,
    wholesaleMarginPct = 8.0,   // Max wholesale margin: 8%
    retailMarginPct = 18.0,     // Max consumer retail margin: 18%
    packagingPerKg = 3.5,
  } = params;

  // Logistics cost model:
  // Base transport rate per ton-km: approx 0.045 DZD/kg/100km + refrigeration factor (1.35x)
  const baseTransportPerKg = (distanceKm / 100) * 4.5 * (dieselPricePerLiter / 29.0);
  const coldChainMultiplier = requiresColdChain ? 1.4 : 1.0;
  const logisticsCostPerKg = Number((baseTransportPerKg * coldChainMultiplier).toFixed(2));

  const packagingCost = packagingPerKg;
  const subtotalBeforeWholesale = Number((farmGatePrice + logisticsCostPerKg + packagingCost).toFixed(2));

  // Wholesale margin
  const wholesaleMarginAmount = Number((subtotalBeforeWholesale * (wholesaleMarginPct / 100)).toFixed(2));
  const fairWholesaleCeiling = Number((subtotalBeforeWholesale + wholesaleMarginAmount).toFixed(2));

  // Retail margin
  const retailMarginAmount = Number((fairWholesaleCeiling * (retailMarginPct / 100)).toFixed(2));
  const fairRetailCeiling = Number((fairWholesaleCeiling + retailMarginAmount).toFixed(2));

  return {
    farmGatePrice,
    logisticsCostPerKg,
    packagingCostPerKg: packagingCost,
    subtotalBeforeWholesale,
    wholesaleMarginAmount,
    fairWholesaleCeiling,
    retailMarginAmount,
    fairRetailCeiling,
    statusAgainstObserved: (observedPrice: number) => {
      const excess = observedPrice - fairRetailCeiling;
      const deltaPct = Number(((excess / fairRetailCeiling) * 100).toFixed(1));

      if (deltaPct <= 0) {
        return {
          status: 'fair',
          deltaPct,
          excessAmountDzd: 0,
          labelAr: 'سعر عادل وقانوني (ممتثل)',
          descriptionAr: 'السعر المعروض يقع ضمن سقف الهوامش القانونية ولا يشكل أي مخالفة تجارية.',
        };
      } else if (deltaPct <= 12) {
        return {
          status: 'warning',
          deltaPct,
          excessAmountDzd: Number(excess.toFixed(2)),
          labelAr: 'هامش مرتفع (إنذار احترازي)',
          descriptionAr: 'السعر يتجاوز السقف بنسبة طفيفة تستوجب التحقق من فواتير الشراء الوسيطة.',
        };
      } else {
        return {
          status: 'gouging',
          deltaPct,
          excessAmountDzd: Number(excess.toFixed(2)),
          labelAr: 'شبهة مضاربة غير مشروعة (تضخم احتكاري)',
          descriptionAr: 'السعر يتجاوز السقف بنسبة غير مبررة؛ خاضع لقانون مكافحة المضاربة 21-15 وتدخل مصالح الرقابة الفوري.',
        };
      }
    },
  };
}
