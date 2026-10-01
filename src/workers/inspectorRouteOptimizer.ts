import Redis from 'ioredis';
import { Pool } from 'pg';

export interface ViolationTicket {
  ticketNumber: string;
  productName: string;
  storeName: string;
  observedPrice: number;
  ceilingPrice: number;
  inflationDeltaPct: number;
  zScore: number;
  slaMinutes: number;
  locationCoords: {
    latitude: number;
    longitude: number;
  };
  urgencyScore?: number;
  createdAt: number;
}

export interface InspectorLocation {
  inspectorId: string;
  badgeNumber: string;
  latitude: number;
  longitude: number;
}

export class InspectorDispatchWorker {
  private redisSubscriber: Redis;
  private redisPublisher: Redis;
  private pool: Pool;
  private activeTickets: ViolationTicket[] = [];
  private isRunning: boolean = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redisSubscriber = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
    });
    this.redisPublisher = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
    });
    this.pool = new Pool({ 
      connectionString: process.env.DATABASE_URL || 'postgres://localhost:5432/kareema_platform',
      max: 10,
    });
  }

  /**
   * تشغيل المستمع اللحظي لطابور البلاغات
   */
  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[Kareema Worker Daemon] Starting Inspector Dispatch & TSP Route Optimizer...');
    
    try {
      await this.redisSubscriber.subscribe('INSPECTOR_QUEUE');
    } catch (err) {
      console.warn('[Kareema Worker] Redis subscribe deferred or offline in container start:', err);
    }

    this.redisSubscriber.on('message', async (channel, message) => {
      if (channel === 'INSPECTOR_QUEUE') {
        try {
          const ticket: ViolationTicket = JSON.parse(message);
          ticket.createdAt = Date.now();
          ticket.urgencyScore = this.calculateUrgencyScore(ticket);
          
          this.activeTickets.push(ticket);
          console.log(`[Worker Daemon] Enqueued ticket: ${ticket.ticketNumber} | Urgency: ${ticket.urgencyScore}`);

          // فرز التذاكر حسب درجة الإلحاح تنازلياً
          this.activeTickets.sort((a, b) => (b.urgencyScore || 0) - (a.urgencyScore || 0));

          // إذا توفر 3 بلاغات أو أكثر، يتم حساب المسار الأمثل للدورية الأقرب
          if (this.activeTickets.length >= 3) {
            await this.optimizeAndDispatchNearestPatrol();
          }
        } catch (err) {
          console.error('[Worker Error] Failed to parse inspector event:', err);
        }
      }
    });

    this.redisSubscriber.on('error', (err) => {
      console.error('[Worker Redis Error]:', err.message);
    });
  }

  /**
   * إيقاف آمن للخدمة (Graceful Shutdown)
   */
  public async stop(): Promise<void> {
    console.log('[Kareema Worker Daemon] Shutting down gracefully...');
    this.isRunning = false;
    await this.redisSubscriber.unsubscribe();
    await this.redisSubscriber.quit();
    await this.redisPublisher.quit();
    await this.pool.end();
    console.log('[Kareema Worker Daemon] All connections closed successfully.');
  }

  /**
   * حساب مؤشر الإلحاح (Urgency Score)
   */
  public calculateUrgencyScore(ticket: ViolationTicket): number {
    const inflationWeight = Math.min(100, ticket.inflationDeltaPct * 1.5);
    const zScoreWeight = Math.min(50, ticket.zScore * 10);
    const slaUrgency = Math.max(10, 240 - ticket.slaMinutes);
    return Math.round(inflationWeight + zScoreWeight + (slaUrgency * 0.5));
  }

  /**
   * حساب المسافة الجغرافية بالكيلومتر (Haversine formula)
   */
  public calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  /**
   * خوارزمية المسار الأمثل TSP (Greedy Nearest Neighbor + 2-Opt Refinement)
   */
  public solveTspRoute(
    startLocation: { latitude: number; longitude: number },
    stops: ViolationTicket[]
  ): { orderedStops: ViolationTicket[]; totalDistanceKm: number } {
    if (stops.length <= 1) {
      const dist = stops.length === 1 
        ? this.calculateDistanceKm(startLocation.latitude, startLocation.longitude, stops[0].locationCoords.latitude, stops[0].locationCoords.longitude)
        : 0;
      return { orderedStops: stops, totalDistanceKm: dist };
    }

    const unvisited = [...stops];
    const ordered: ViolationTicket[] = [];
    let currentLat = startLocation.latitude;
    let currentLon = startLocation.longitude;
    let totalDist = 0;

    // 1. Greedy Nearest Neighbor
    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const d = this.calculateDistanceKm(
          currentLat,
          currentLon,
          unvisited[i].locationCoords.latitude,
          unvisited[i].locationCoords.longitude
        );
        if (d < minDistance) {
          minDistance = d;
          nearestIdx = i;
        }
      }

      const nextStop = unvisited.splice(nearestIdx, 1)[0];
      ordered.push(nextStop);
      totalDist += minDistance;
      currentLat = nextStop.locationCoords.latitude;
      currentLon = nextStop.locationCoords.longitude;
    }

    // 2. 2-Opt Optimization Pass لفك التقاطعات المكانية
    let improved = true;
    let iterations = 0;
    while (improved && iterations < 50) {
      improved = false;
      iterations++;
      for (let i = 0; i < ordered.length - 1; i++) {
        for (let k = i + 1; k < ordered.length; k++) {
          const dCurrent = this.calculateDistanceKm(
            ordered[i].locationCoords.latitude,
            ordered[i].locationCoords.longitude,
            ordered[k].locationCoords.latitude,
            ordered[k].locationCoords.longitude
          );
          if (k + 1 < ordered.length) {
            const dNext = this.calculateDistanceKm(
              ordered[i].locationCoords.latitude,
              ordered[i].locationCoords.longitude,
              ordered[k + 1].locationCoords.latitude,
              ordered[k + 1].locationCoords.longitude
            );
            if (dNext < dCurrent) {
              const reversedSegment = ordered.slice(i + 1, k + 1).reverse();
              ordered.splice(i + 1, reversedSegment.length, ...reversedSegment);
              improved = true;
            }
          }
        }
      }
    }

    return { orderedStops: ordered, totalDistanceKm: Number(totalDist.toFixed(2)) };
  }

  /**
   * ربط المسار بالدورية وإرسال Payload إلى شاشات المفتشين
   */
  private async optimizeAndDispatchNearestPatrol(): Promise<void> {
    const patrolLocation: InspectorLocation = {
      inspectorId: 'INSP-16-042',
      badgeNumber: 'ALG-DTR-16',
      latitude: 36.753,
      longitude: 3.058, // Central Algiers Dispatch Center
    };

    const ticketsBatch = this.activeTickets.splice(0, 5); // Take top 5 urgent tickets
    const tspSolution = this.solveTspRoute(patrolLocation, ticketsBatch);

    const dispatchPayload = {
      missionCode: 'MSN-TSP-' + Date.now().toString().slice(-6),
      assignedInspector: patrolLocation,
      totalDistanceKm: tspSolution.totalDistanceKm,
      estimatedDurationMinutes: Math.round(tspSolution.totalDistanceKm * 3.5),
      orderedWaypoints: tspSolution.orderedStops.map((t, idx) => ({
        sequenceNumber: idx + 1,
        ticketNumber: t.ticketNumber,
        storeName: t.storeName,
        productName: t.productName,
        inflationDeltaPct: t.inflationDeltaPct,
        coordinates: [t.locationCoords.latitude, t.locationCoords.longitude],
      })),
      dispatchedAt: new Date().toISOString(),
    };

    try {
      await this.redisPublisher.publish('INSPECTOR_DISPATCH_ROUTE', JSON.stringify(dispatchPayload));
      console.log(`[TSP Dispatch] Mission ${dispatchPayload.missionCode} generated: ${tspSolution.totalDistanceKm} km for ${tspSolution.orderedStops.length} stops.`);
    } catch (publishErr) {
      console.error('[Worker Publish Error]:', publishErr);
    }
  }
}
