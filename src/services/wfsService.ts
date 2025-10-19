import axios from "axios";

export interface WFSFeature {
  type: "Feature";
  properties: Record<string, any>;
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
}

export interface WFSResponse {
  type: "FeatureCollection";
  features: WFSFeature[];
}

export class WFSService {
  private baseUrl: string;
  private username: string;
  private password: string;

  constructor(baseUrl?: string, username?: string, password?: string) {
    this.baseUrl =
      baseUrl || import.meta.env.VITE_WFS_BASE_URL || "https://example.com/wfs";
    this.username = username || import.meta.env.VITE_WFS_USERNAME || "mo";
    this.password = password || import.meta.env.VITE_WFS_PASSWORD || "mo";
  }

  async getFeatureByPoint(
    lat: number,
    lng: number,
    layerName: string,
    buffer: number = 0.001
  ): Promise<WFSResponse | null> {
    try {
      const bbox = this.createBboxFromPoint(lat, lng, buffer);

      const params = new URLSearchParams({
        service: "WFS",
        version: "1.1.0",
        request: "GetFeature",
        typeName: layerName,
        outputFormat: "application/json",
        bbox: bbox,
        srsname: "EPSG:4326",
      });

      const url = `${this.baseUrl}?${params.toString()}`;

      const response = await axios.get(url, {
        auth: {
          username: this.username,
          password: this.password,
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      console.error("WFS GetFeature error:", error);
      return null;
    }
  }

  async getFeaturesByBbox(
    bbox: string,
    layerName: string
  ): Promise<WFSResponse | null> {
    try {
      const params = new URLSearchParams({
        service: "WFS",
        version: "1.1.0",
        request: "GetFeature",
        typeName: layerName,
        outputFormat: "application/json",
        bbox: bbox,
        srsname: "EPSG:4326",
      });

      const url = `${this.baseUrl}?${params.toString()}`;

      const response = await axios.get(url, {
        auth: {
          username: this.username,
          password: this.password,
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      console.error("WFS GetFeature error:", error);
      return null;
    }
  }

  private createBboxFromPoint(
    lat: number,
    lng: number,
    buffer: number
  ): string {
    const minLng = lng - buffer;
    const minLat = lat - buffer;
    const maxLng = lng + buffer;
    const maxLat = lat + buffer;

    return `${minLng},${minLat},${maxLng},${maxLat}`;
  }

  async getCapabilities(): Promise<any> {
    try {
      const params = new URLSearchParams({
        service: "WFS",
        version: "1.1.0",
        request: "GetCapabilities",
      });

      const url = `${this.baseUrl}?${params.toString()}`;

      const response = await axios.get(url, {
        auth: {
          username: this.username,
          password: this.password,
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      console.error("WFS GetCapabilities error:", error);
      return null;
    }
  }
}
