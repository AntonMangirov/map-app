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
}

// Компонент для обработки кликов
const MapClickHandler: React.FC<{
  onFeatureClick: (feature: WFSFeature) => void;
  wfsService?: WFSService;
  layerName?: string;
}> = ({ onFeatureClick, wfsService, layerName }) => {
  useMapClick({ onFeatureClick, wfsService, layerName });
  return null;
};

// Компонент для отображения маркера
const FeatureMarker: React.FC<{
  feature: WFSFeature | null;
}> = ({ feature }) => {
  if (!feature || !feature.geometry || feature.geometry.type !== "Point") {
    return null;
  }

  const coordinates = feature.geometry.coordinates as [number, number];
  const [lng, lat] = coordinates;

  // Создаем кастомную иконку
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
}) => {
  const [wfsService] = useState(
    () => new WFSService("https://example.com/wfs")
  );
  const [wmsService] = useState(
    () => new WMSService("https://example.com/wms")
  );
  const [selectedFeature, setSelectedFeature] = useState<WFSFeature | null>(
    null
  );
  const [layerName] = useState("test_layer"); // В реальном проекте это должно быть динамически

  // Центр карты (Москва)
  const center: [number, number] = [55.7558, 37.6176];
  const zoom = 10;

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
      {/* Базовый слой OpenStreetMap */}
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* WMS слои */}
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

      {/* Обработчик кликов */}
      <MapClickHandler
        onFeatureClick={handleFeatureClick}
        wfsService={selectedLayers.wfs ? wfsService : undefined}
        layerName={layerName}
      />

      {/* Отображение выбранной фичи */}
      <FeatureMarker feature={selectedFeature} />
    </MapContainer>
  );
};

export default MapView;
