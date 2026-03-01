/**
 * API service for Feature Engineering
 * Provides functions to enhance accommodation data with feature engineering results
 */

import {
  calculateFeatures,
  calculateFeaturesBatch,
  FeatureEngineeringResult,
} from "./featureEngineering";
import { HotelSummary } from "./bookingApi";

export interface EnhancedAccommodation extends HotelSummary {
  features?: FeatureEngineeringResult;
}

/**
 * Enhance a single accommodation with feature engineering data
 */
export async function enhanceAccommodation(
  accommodation: HotelSummary,
  workplaceName?: string,
  workplaceLat?: number,
  workplaceLon?: number
): Promise<EnhancedAccommodation> {
  if (!accommodation.latitude || !accommodation.longitude) {
    return { ...accommodation };
  }

  const features = await calculateFeatures(
    accommodation.latitude,
    accommodation.longitude,
    workplaceName,
    workplaceLat,
    workplaceLon
  );

  return {
    ...accommodation,
    features,
  };
}

/**
 * Enhance multiple accommodations with feature engineering data
 */
export async function enhanceAccommodations(
  accommodations: HotelSummary[],
  workplaceName?: string,
  workplaceLat?: number,
  workplaceLon?: number
): Promise<EnhancedAccommodation[]> {
  const accommodationsWithCoords = accommodations.filter(
    (acc) => acc.latitude !== undefined && acc.longitude !== undefined
  );

  const batchData = accommodationsWithCoords.map((acc) => ({
    id: acc.id,
    lat: acc.latitude!,
    lon: acc.longitude!,
  }));

  const featuresMap = await calculateFeaturesBatch(
    batchData,
    workplaceName,
    workplaceLat,
    workplaceLon
  );

  return accommodations.map((acc) => {
    if (!acc.latitude || !acc.longitude) {
      return { ...acc };
    }

    const features = featuresMap.get(acc.id);
    return {
      ...acc,
      features,
    };
  });
}
