export interface WMSLayer {
  name: string;
  title: string;
  abstract?: string;
  crs: string[];
  bbox: {
    minx: number;
    miny: number;
    maxx: number;
    maxy: number;
  };
}

export interface WMSGetCapabilitiesResponse {
  WMS_Capabilities: {
    Capability: {
      Layer: {
        Layer: WMSLayer[];
      };
    };
  };
}

export class WMSService {
  public baseUrl: string;
  private username: string;
  private password: string;

  constructor(baseUrl?: string, username?: string, password?: string) {
    this.baseUrl = baseUrl || import.meta.env.VITE_WMS_BASE_URL || "";
    this.username = username || import.meta.env.VITE_WMS_USERNAME || "";
    this.password = password || import.meta.env.VITE_WMS_PASSWORD || "";
  }

  getWMSUrl(
    layerName: string,
    bbox: string,
    width: number = 256,
    height: number = 256
  ): string {
    const params = new URLSearchParams({
      service: "WMS",
      version: "1.3.0",
      request: "GetMap",
      layers: layerName,
      styles: "",
      format: "image/png",
      transparent: "true",
      width: width.toString(),
      height: height.toString(),
      crs: "EPSG:4326",
      bbox: bbox,
    });

    return `${this.baseUrl}?${params.toString()}`;
  }

  async getCapabilities(): Promise<WMSGetCapabilitiesResponse | null> {
    try {
      const params = new URLSearchParams({
        service: "WMS",
        version: "1.3.0",
        request: "GetCapabilities",
      });

      const url = `${this.baseUrl}?${params.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Basic ${btoa(`${this.username}:${this.password}`)}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      return this.parseCapabilitiesXML(text);
    } catch (error) {
      console.error("WMS GetCapabilities error:", error);
      return null;
    }
  }

  private parseCapabilitiesXML(xml: string): WMSGetCapabilitiesResponse | null {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, "text/xml");

      const layers = doc.querySelectorAll("Layer");
      const wmsLayers: WMSLayer[] = [];

      layers.forEach((layer) => {
        const name = layer.querySelector("Name")?.textContent;
        const title = layer.querySelector("Title")?.textContent;
        const abstract = layer.querySelector("Abstract")?.textContent;

        if (name && title) {
          wmsLayers.push({
            name,
            title,
            abstract,
            crs: ["EPSG:4326"],
            bbox: {
              minx: -180,
              miny: -90,
              maxx: 180,
              maxy: 90,
            },
          });
        }
      });

      return {
        WMS_Capabilities: {
          Capability: {
            Layer: {
              Layer: wmsLayers,
            },
          },
        },
      };
    } catch (error) {
      console.error("XML parsing error:", error);
      return null;
    }
  }

  createBbox(
    minLng: number,
    minLat: number,
    maxLng: number,
    maxLat: number
  ): string {
    return `${minLng},${minLat},${maxLng},${maxLat}`;
  }
}
