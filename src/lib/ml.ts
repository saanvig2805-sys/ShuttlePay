import type { Shuttle, ShuttleRoute, ShuttleStop } from '@/types';
import { shuttleRoutes } from '@/data/shuttleData';

/**
 * Lightweight ML module for Shuttle app.
 *
 * Three models trained client-side from synthetic historical data:
 * 1. ETAPredictor — linear regression on (distance, timeOfDay, dayOfWeek, trafficFactor)
 * 2. DemandPredictor — predicts riders per stop per hour using historical patterns
 * 3. ShuttleRecommender — scores shuttles by combining ETA, demand, seat availability
 *
 * Training uses batch gradient descent. Models are trained once on app startup
 * from a synthetic dataset (~500 ride records) and cached for the session.
 */

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalizeFeature(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

// ---------------------------------------------------------------------------
// 1. ETA Predictor (Linear Regression via Gradient Descent)
// ---------------------------------------------------------------------------

/**
 * Features: [distanceKm, timeOfDayNorm, isPeakHour, trafficFactor, numStopsToDest]
 * Target: actual travel time in minutes
 */

interface ETASample {
  distanceKm: number;
  timeOfDayNorm: number;
  isPeakHour: number;
  trafficFactor: number;
  numStopsToDest: number;
  actualMinutes: number;
}

class ETAPredictor {
  private weights: number[] = [0, 0, 0, 0, 0];
  private bias = 0;
  private featureStats = {
    distanceKm: { min: 0, max: 5 },
    timeOfDayNorm: { min: 0, max: 1 },
    isPeakHour: { min: 0, max: 1 },
    trafficFactor: { min: 0.5, max: 2 },
    numStopsToDest: { min: 1, max: 8 },
  };

  private normalize(sample: ETASample): number[] {
    return [
      normalizeFeature(sample.distanceKm, this.featureStats.distanceKm.min, this.featureStats.distanceKm.max),
      normalizeFeature(sample.timeOfDayNorm, this.featureStats.timeOfDayNorm.min, this.featureStats.timeOfDayNorm.max),
      sample.isPeakHour,
      normalizeFeature(sample.trafficFactor, this.featureStats.trafficFactor.min, this.featureStats.trafficFactor.max),
      normalizeFeature(sample.numStopsToDest, this.featureStats.numStopsToDest.min, this.featureStats.numStopsToDest.max),
    ];
  }

  train(samples: ETASample[], epochs: number = 200, learningRate: number = 0.05): { lossHistory: number[] } {
    const lossHistory: number[] = [];
    const n = samples.length;

    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalLoss = 0;
      const gradW = [0, 0, 0, 0, 0];
      let gradB = 0;

      for (const s of samples) {
        const x = this.normalize(s);
        const pred = dotProduct(x, this.weights) + this.bias;
        const error = pred - s.actualMinutes;
        totalLoss += error * error;

        for (let j = 0; j < this.weights.length; j++) {
          gradW[j] += (2 / n) * error * x[j];
        }
        gradB += (2 / n) * error;
      }

      for (let j = 0; j < this.weights.length; j++) {
        this.weights[j] -= learningRate * gradW[j];
      }
      this.bias -= learningRate * gradB;

      lossHistory.push(totalLoss / n);
    }

    return { lossHistory };
  }

  predict(input: Omit<ETASample, 'actualMinutes'>): number {
    const x = this.normalize(input as ETASample);
    const pred = dotProduct(x, this.weights) + this.bias;
    return Math.max(1, Math.round(pred));
  }

  getWeights(): { weights: number[]; bias: number } {
    return { weights: [...this.weights], bias: this.bias };
  }
}

// ---------------------------------------------------------------------------
// 2. Demand Predictor (Hourly ridership per stop)
// ---------------------------------------------------------------------------

/**
 * Predicts how many students will be waiting at a given stop at a given hour.
 * Uses a simple weighted average model with peak-hour multipliers and
 * historical patterns stored per stop.
 */

interface DemandSample {
  stopName: string;
  hour: number;
  riders: number;
}

class DemandPredictor {
  private stopPatterns: Map<string, number[]> = new Map();
  private globalHourlyPattern: number[] = new Array(24).fill(0);

  train(samples: DemandSample[]): void {
    const stopHourly: Map<string, number[]> = new Map();
    const stopHourlyCount: Map<string, number[]> = new Map();

    for (const s of samples) {
      if (!stopHourly.has(s.stopName)) {
        stopHourly.set(s.stopName, new Array(24).fill(0));
        stopHourlyCount.set(s.stopName, new Array(24).fill(0));
      }
      stopHourly.get(s.stopName)![s.hour] += s.riders;
      stopHourlyCount.get(s.stopName)![s.hour] += 1;
    }

    for (const [stop, hourly] of stopHourly) {
      const counts = stopHourlyCount.get(stop)!;
      const avg = hourly.map((sum, h) => (counts[h] > 0 ? sum / counts[h] : 0));
      this.stopPatterns.set(stop, avg);

      for (let h = 0; h < 24; h++) {
        this.globalHourlyPattern[h] += avg[h];
      }
    }

    const numStops = stopHourly.size;
    for (let h = 0; h < 24; h++) {
      this.globalHourlyPattern[h] /= numStops || 1;
    }
  }

  predict(stopName: string, hour: number): number {
    const pattern = this.stopPatterns.get(stopName);
    if (pattern && pattern[hour] !== undefined) {
      return Math.round(pattern[hour]);
    }
    return Math.round(this.globalHourlyPattern[hour] || 0);
  }

  getPeakHours(): number[] {
    const sorted = [...this.globalHourlyPattern]
      .map((val, hour) => ({ val, hour }))
      .sort((a, b) => b.val - a.val);
    return sorted.slice(0, 3).map((s) => s.hour);
  }
}

// ---------------------------------------------------------------------------
// 3. Shuttle Recommender (Weighted scoring)
// ---------------------------------------------------------------------------

interface RecommendationResult {
  shuttleId: string;
  score: number;
  reasons: string[];
  confidence: number;
}

class ShuttleRecommender {
  score(
    shuttle: Shuttle,
    predictedETA: number,
    predictedDemand: number,
    hour: number
  ): RecommendationResult {
    const seatRatio = shuttle.seatsAvailable / shuttle.totalSeats;
    const reasons: string[] = [];

    let score = 0;

    // ETA score (lower ETA = higher score, max 40 points)
    const etaScore = Math.max(0, 40 - predictedETA * 2);
    score += etaScore;
    if (predictedETA <= 5) reasons.push(`Arriving in just ${predictedETA} min`);

    // Seat availability (max 25 points)
    const seatScore = seatRatio * 25;
    score += seatScore;
    if (seatRatio > 0.5) reasons.push(`${shuttle.seatsAvailable} seats available`);

    // Demand penalty (high demand = lower score, max 20 points)
    const demandScore = Math.max(0, 20 - predictedDemand * 2);
    score += demandScore;
    if (predictedDemand <= 3) reasons.push(`Low waitlist at pickup stop`);

    // Peak hour bonus (10 points if available during peak)
    const isPeak = hour >= 8 && hour <= 10 || hour >= 16 && hour <= 18;
    if (isPeak && seatRatio > 0.3) {
      score += 10;
      reasons.push('Available during peak hours');
    } else if (!isPeak) {
      score += 5;
    }

    // Route coverage bonus (5 points)
    score += 5;

    const confidence = Math.min(0.98, 0.6 + (etaScore / 40) * 0.38);

    return {
      shuttleId: shuttle.id,
      score: Math.round(score * 10) / 10,
      reasons,
      confidence,
    };
  }
}

// ---------------------------------------------------------------------------
// Synthetic data generation + training orchestration
// ---------------------------------------------------------------------------

function generateSyntheticETASamples(count: number): ETASample[] {
  const samples: ETASample[] = [];
  for (let i = 0; i < count; i++) {
    const distanceKm = 0.2 + Math.random() * 4.5;
    const hour = Math.floor(Math.random() * 24);
    const timeOfDayNorm = hour / 23;
    const isPeak = (hour >= 8 && hour <= 10) || (hour >= 16 && hour <= 18) ? 1 : 0;
    const trafficFactor = 1 + isPeak * 0.8 + Math.random() * 0.5;
    const numStopsToDest = 1 + Math.floor(Math.random() * 7);

    // Simulate real-world ETA: base time + distance + traffic + stops
    const baseTime = 3 + distanceKm * 3.5;
    const trafficTime = trafficFactor * 2;
    const stopTime = numStopsToDest * 1.5;
    const noise = (Math.random() - 0.5) * 3;
    const actualMinutes = Math.max(2, baseTime + trafficTime + stopTime + noise);

    samples.push({
      distanceKm,
      timeOfDayNorm,
      isPeakHour: isPeak,
      trafficFactor,
      numStopsToDest,
      actualMinutes,
    });
  }
  return samples;
}

function generateSyntheticDemandSamples(days: number): DemandSample[] {
  const samples: DemandSample[] = [];
  const allStops: string[] = [];
  shuttleRoutes.forEach((r) => r.stops.forEach((s) => allStops.push(s.name)));
  const uniqueStops = [...new Set(allStops)];

  for (let day = 0; day < days; day++) {
    for (const stop of uniqueStops) {
      for (let hour = 6; hour < 22; hour++) {
        const isPeak = (hour >= 8 && hour <= 10) || (hour >= 16 && hour <= 18);
        const isClassStart = hour === 9 || hour === 11 || hour === 14 || hour === 16;
        const base = isPeak ? 8 : isClassStart ? 6 : 2;
        const noise = Math.floor(Math.random() * 4);
        const riders = Math.max(0, base + noise - (hour > 19 ? 3 : 0));
        samples.push({ stopName: stop, hour, riders });
      }
    }
  }
  return samples;
}

// ---------------------------------------------------------------------------
// Singleton ML engine
// ---------------------------------------------------------------------------

export interface MLTrainingProgress {
  stage: 'idle' | 'generating' | 'training_eta' | 'training_demand' | 'ready';
  progress: number;
  loss: number;
  epoch: number;
  totalEpochs: number;
}

export interface MLPrediction {
  etaMinutes: number;
  demandAtPickup: number;
  demandAtDropoff: number;
  confidence: number;
  peakHours: number[];
  recommendation?: RecommendationResult;
}

class MLEngine {
  private etaPredictor = new ETAPredictor();
  private demandPredictor = new DemandPredictor();
  private recommender = new ShuttleRecommender();
  private trained = false;
  private lastLoss = 0;

  isTrained(): boolean {
    return this.trained;
  }

  async train(
    onProgress?: (progress: MLTrainingProgress) => void,
    etaSamplesCount = 500,
    demandDays = 30
  ): Promise<void> {
    // Stage 1: Generate data
    onProgress?.({ stage: 'generating', progress: 5, loss: 0, epoch: 0, totalEpochs: 200 });
    await sleep(200);

    const etaSamples = generateSyntheticETASamples(etaSamplesCount);
    const demandSamples = generateSyntheticDemandSamples(demandDays);

    // Stage 2: Train ETA model with epoch callbacks
    const epochs = 200;
    for (let epoch = 0; epoch < epochs; epoch += 10) {
      const { lossHistory } = this.etaPredictor.train(etaSamples, 10, 0.05);
      this.lastLoss = lossHistory[lossHistory.length - 1];
      onProgress?.({
        stage: 'training_eta',
        progress: 10 + Math.round(((epoch + 10) / epochs) * 50),
        loss: this.lastLoss,
        epoch: epoch + 10,
        totalEpochs: epochs,
      });
      await sleep(15);
    }

    // Stage 3: Train demand model
    onProgress?.({ stage: 'training_demand', progress: 70, loss: this.lastLoss, epoch: epochs, totalEpochs: epochs });
    this.demandPredictor.train(demandSamples);
    await sleep(300);

    this.trained = true;
    onProgress?.({ stage: 'ready', progress: 100, loss: this.lastLoss, epoch: epochs, totalEpochs: epochs });
  }

  predictForShuttle(
    shuttle: Shuttle,
    userLocation: [number, number] | null,
    originStop: ShuttleStop | null,
    destStop: ShuttleStop | null
  ): MLPrediction {
    if (!this.trained) {
      return {
        etaMinutes: shuttle.etaMinutes,
        demandAtPickup: 0,
        demandAtDropoff: 0,
        confidence: 0,
        peakHours: [],
      };
    }

    const now = new Date();
    const hour = now.getHours();
    const timeOfDayNorm = hour / 23;
    const isPeak = (hour >= 8 && hour <= 10) || (hour >= 16 && hour <= 18) ? 1 : 0;
    const trafficFactor = 1 + isPeak * 0.8 + 0.3;

    // Distance from shuttle to pickup stop (or user location)
    let distanceKm = 0.5;
    if (originStop) {
      distanceKm = haversineMeters(shuttle.lat, shuttle.lng, originStop.lat, originStop.lng) / 1000;
    } else if (userLocation) {
      distanceKm = haversineMeters(shuttle.lat, shuttle.lng, userLocation[0], userLocation[1]) / 1000;
    }

    // Count stops from pickup to destination
    let numStopsToDest = 3;
    if (originStop && destStop) {
      const routeStops = shuttle.route.stops;
      const originIdx = routeStops.findIndex((s) => s.name === originStop.name);
      const destIdx = routeStops.findIndex((s) => s.name === destStop.name);
      if (originIdx >= 0 && destIdx >= 0) {
        numStopsToDest = Math.max(1, Math.abs(destIdx - originIdx));
      }
    }

    const etaMinutes = this.etaPredictor.predict({
      distanceKm,
      timeOfDayNorm,
      isPeakHour: isPeak,
      trafficFactor,
      numStopsToDest,
    });

    const demandAtPickup = originStop
      ? this.demandPredictor.predict(originStop.name, hour)
      : 0;
    const demandAtDropoff = destStop
      ? this.demandPredictor.predict(destStop.name, hour)
      : 0;

    const recommendation = this.recommender.score(shuttle, etaMinutes, demandAtPickup, hour);

    return {
      etaMinutes,
      demandAtPickup,
      demandAtDropoff,
      confidence: recommendation.confidence,
      peakHours: this.demandPredictor.getPeakHours(),
      recommendation,
    };
  }

  recommendShuttle(
    shuttles: Shuttle[],
    userLocation: [number, number] | null,
    originStop: ShuttleStop | null,
    destStop: ShuttleStop | null
  ): { shuttle: Shuttle; prediction: MLPrediction } | null {
    if (!this.trained || shuttles.length === 0) return null;

    let best: { shuttle: Shuttle; prediction: MLPrediction } | null = null;
    let bestScore = -1;

    for (const shuttle of shuttles) {
      const prediction = this.predictForShuttle(shuttle, userLocation, originStop, destStop);
      if (prediction.recommendation && prediction.recommendation.score > bestScore) {
        bestScore = prediction.recommendation.score;
        best = { shuttle, prediction };
      }
    }

    return best;
  }

  getLastLoss(): number {
    return this.lastLoss;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Singleton
export const mlEngine = new MLEngine();

// Helper to find nearest stop on a route for a given name
export function findStopByName(route: ShuttleRoute, name: string): ShuttleStop | null {
  return route.stops.find((s) => s.name.toLowerCase().includes(name.toLowerCase())) ?? null;
}
