import Papa from 'papaparse';

export interface HouseRentData {
  pg_name: string;
  area: string;
  latitude: number;
  longitude: number;
  listing_url: string;
  images: string[];
  price_per_month: string;
  room_type: string;
  food_included: string;
  wifi: string;
  ac: string;
  rating: number;
  review_count: string;
  contact_number: string;
  distance_to_city_center_km: number;
  description: string;
}

export const loadHouseRentData = async (): Promise<HouseRentData[]> => {
  const response = await fetch('/datasets/coimbatore_houseonrent_dataset.csv');
  const csvText = await response.text();
  
  return new Promise((resolve) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data.map((row: any) => ({
          ...row,
          latitude: parseFloat(row.latitude),
          longitude: parseFloat(row.longitude),
          rating: parseFloat(row.rating),
          distance_to_city_center_km: parseFloat(row.distance_to_city_center_km),
          images: row.images ? row.images.split('|').map((img: string) => img.trim()) : [],
        }));
        resolve(data);
      },
    });
  });
};
