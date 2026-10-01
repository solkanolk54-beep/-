export type UserRole = 
  | 'citizen'      // مواطن مراقب
  | 'farmer'       // منتج فلاحي
  | 'transporter'  // ناقل لوجستي
  | 'wholesaler'   // وكيل جملة
  | 'retailer'     // تاجر تجزئة
  | 'inspector'    // مفتش قمع الغش والتجارة
  | 'admin';       // إدارة المنظومة المركزية

export type PriceStatus = 'fair' | 'warning' | 'gouging';

export interface Commodity {
  id: string;
  nameAr: string;
  nameEn: string;
  category: 'vegetables' | 'fruits' | 'meat' | 'poultry' | 'fish' | 'grains';
  unit: string;
  icon: string;
  baseFarmGateCost: number;     // DZD/kg
  averageLogisticsCost: number; // DZD/kg
  maxWholesaleMarginPct: number; // %
  maxRetailMarginPct: number;    // %
  officialCeilingPrice: number;  // DZD/kg (السعر المرجعي / المسقف)
  currentMarketAvgPrice: number; // DZD/kg
  dailyVolatilityPct: number;    // % change today
  status: PriceStatus;
  telemetryInputs: {
    seedAndSeedlingsCost: number;
    fertilizerAndChemicals: number;
    irrigationAndEnergy: number;
    laborAndHarvesting: number;
    packagingCost: number;
  };
}

export interface ShipmentPassport {
  id: string;
  qrPayload: string;
  truckPlate: string;
  driverName: string;
  driverNationalIdHash: string;
  originFarmName: string;
  originWilaya: string;
  originCoordinates: [number, number]; // [lat, lng]
  destinationMarketName: string;
  destinationWilaya: string;
  destinationCoordinates: [number, number];
  commodityId: string;
  commodityNameAr: string;
  quantityTons: number;
  farmGatePricePerKg: number;
  calculatedFairWholesalePerKg: number;
  departureTime: string;
  expectedArrivalTime: string;
  status: 'dispatched' | 'in_transit' | 'hoarding_suspicion' | 'delivered' | 'inspected';
  temperatureLogC: number;
  currentLocation: [number, number];
  deviationDetected: boolean;
  suspicionReason?: string;
  waypoints: {
    timestamp: string;
    location: [number, number];
    label: string;
    verifiedByPostGIS: boolean;
  }[];
}

export interface CitizenReport {
  id: string;
  ticketNumber: string;
  commodityId: string;
  commodityNameAr: string;
  observedPrice: number;
  ceilingPrice: number;
  inflationDeltaPct: number;
  storeName: string;
  storeAddress: string;
  wilaya: string;
  baladiya: string;
  coordinates: [number, number];
  receiptImageUrl?: string;
  reporterBadge: string;
  status: 'pending' | 'triaged' | 'inspector_dispatched' | 'verified_violation' | 'dismissed';
  createdAt: string;
  slaMinutesRemaining: number;
  inspectorNotes?: string;
  assignedInspector?: string;
}

export interface InspectionMission {
  id: string;
  missionCode: string;
  inspectorName: string;
  badgeNumber: string;
  assignedWilaya: string;
  targetCount: number;
  optimizedRouteDistanceKm: number;
  status: 'pending' | 'in-progress' | 'completed' | 'active' | 'scheduled';
  urgencyLevel?: 'critical' | 'high' | 'medium';
  slaMinutesRemaining?: number;
  stops: {
    storeName: string;
    reportId: string;
    coordinates: [number, number];
    priority: 'critical' | 'high' | 'medium';
    status: 'pending' | 'inspected_fined' | 'inspected_cleared';
  }[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actionAr: string;
  actorRole: UserRole;
  actorId: string;
  targetEntity: string;
  blockHash: string;
  previousHash: string;
  status: 'immutable_verified' | 'tamper_proof';
}

export interface AnomalyAlert {
  id: string;
  commodityId: string;
  commodityNameAr: string;
  wilaya: string;
  type: 'sudden_spike' | 'unusual_hoarding' | 'cross_border_leakage' | 'cold_storage_refusal';
  severity: 'critical' | 'high' | 'medium';
  confidencePct: number;
  descriptionAr: string;
  recommendedActionAr: string;
  timestamp: string;
}
