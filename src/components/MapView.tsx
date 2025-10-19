import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import { useMapClick } from "../hooks/useMapClick";
import { WFSService } from "../services/wfsService";
import type { WFSFeature } from "../services/wfsService";
import { WMSService } from "../services/wmsService";

interface MapViewProps {
  selectedLayers: {
    wms: boolean;
    wfs: boolean;
    zws: boolean;
  };
  onFeatureClick: (feature: WFSFeature) => void;
  onError?: (error: Error) => void;
}

const MapClickHandler: React.FC<{
  onFeatureClick: (feature: WFSFeature) => void;
  onError?: (error: Error) => void;
  wfsService?: WFSService;
  layerName?: string;
}> = ({ onFeatureClick, onError, wfsService, layerName }) => {
  useMapClick({ onFeatureClick, onError, wfsService, layerName });
  return null;
};

const FeatureMarker: React.FC<{
  feature: WFSFeature | null;
}> = ({ feature }) => {
  if (!feature || !feature.geometry || feature.geometry.type !== "Point") {
    return null;
  }

  const coordinates = feature.geometry.coordinates as [number, number];
  const [lng, lat] = coordinates;

  const customIcon = new Icon({
    iconUrl:
      "data:image/svg+xml;base64," +
      btoa(`
      <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="#3388ff"/>
        <circle cx="12.5" cy="12.5" r="8" fill="white"/>
      </svg>
    `),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  });

  return (
    <Marker position={[lat, lng]} icon={customIcon}>
      <Popup>
        <div>
          <h3>Информация об объекте</h3>
          {Object.entries(feature.properties).map(([key, value]) => (
            <div key={key}>
              <strong>{key}:</strong> {String(value)}
            </div>
          ))}
        </div>
      </Popup>
    </Marker>
  );
};

const MapView: React.FC<MapViewProps> = ({
  selectedLayers,
  onFeatureClick,
  onError,
}) => {
  const [wfsService] = useState(() => new WFSService());
  const [wmsService] = useState(() => new WMSService());
  const [selectedFeature, setSelectedFeature] = useState<WFSFeature | null>(
    null
  );
  const [layerName] = useState(
    import.meta.env.VITE_DEFAULT_LAYER_NAME || "test_layer"
  );

  const center: [number, number] = [
    Number(import.meta.env.VITE_MAP_CENTER_LAT) || 55.7558,
    Number(import.meta.env.VITE_MAP_CENTER_LNG) || 37.6176,
  ];
  const zoom = Number(import.meta.env.VITE_MAP_ZOOM) || 10;

  const handleFeatureClick = (feature: WFSFeature) => {
    setSelectedFeature(feature);
    onFeatureClick(feature);
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {selectedLayers.wms && (
        <TileLayer
          url={wmsService.getWMSUrl(
            layerName,
            wmsService.createBbox(-180, -90, 180, 90),
            256,
            256
          )}
        />
      )}

      <MapClickHandler
        onFeatureClick={handleFeatureClick}
        onError={onError}
        wfsService={selectedLayers.wfs ? wfsService : undefined}
        layerName={layerName}
      />

      <FeatureMarker feature={selectedFeature} />
    </MapContainer>
  );
};

export default MapView;
