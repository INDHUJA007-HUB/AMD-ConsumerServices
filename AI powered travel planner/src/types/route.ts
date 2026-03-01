export interface PathStep {
    lat: number;
    lon: number;
    name?: string;
}

export interface RouteOption {
    id: string;
    type: string;
    title: string;
    duration: number; // in mins
    distance: number; // in km
    co2: number; // in g
    cost: number; // in currency
    mode: string;
    pathOptions: PathStep[];
    description: string;
    geometry?: {
        lineString?: [number, number][]; // [longitude, latitude][]
    };
    alternateGeometries?: {
        lineString?: [number, number][];
        duration?: number;
        distance?: number;
    }[];
}
