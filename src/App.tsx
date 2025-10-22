import { useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  Paper,
  List,
  ListItem,
  Switch,
  FormControlLabel,
  Divider,
} from "@mui/material";
import { Layers as LayersIcon, Info as InfoIcon } from "@mui/icons-material";
import MapView from "./components/MapView";
import type { WFSFeature } from "./services/wfsService";

function App() {
  const [layersOpen, setLayersOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<WFSFeature | null>(
    null
  );
  const [selectedLayers, setSelectedLayers] = useState({
    wms: true,
    wfs: true,
    zws: false,
  });

  const handleLayerToggle = (layer: string) => {
    setSelectedLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer as keyof typeof prev],
    }));
  };

  const toggleLayers = () => {
    setLayersOpen(!layersOpen);
  };

  const toggleInfo = () => {
    setInfoOpen(!infoOpen);
  };

  const handleFeatureClick = (feature: WFSFeature) => {
    setSelectedFeature(feature);
    setInfoOpen(true);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <AppBar position="static" sx={{ zIndex: 1300 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Картографическое приложение
            {selectedLayers.wms && (
              <span style={{ color: "#4caf50", marginLeft: "8px" }}>
                &#9679;
              </span>
            )}
            {selectedLayers.wfs && (
              <span style={{ color: "#2196f3", marginLeft: "4px" }}>
                &#9679;
              </span>
            )}
            {selectedLayers.zws && (
              <span style={{ color: "#ff9800", marginLeft: "4px" }}>
                &#9679;
              </span>
            )}
          </Typography>
          <IconButton
            color="inherit"
            onClick={toggleLayers}
            aria-label="Управление слоями"
          >
            <LayersIcon />
          </IconButton>
          <IconButton
            color="inherit"
            onClick={toggleInfo}
            aria-label="Информация"
          >
            <InfoIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex", flexGrow: 1, position: "relative" }}>
        <MapView
          selectedLayers={selectedLayers}
          onFeatureClick={handleFeatureClick}
        />

        {infoOpen && (
          <Paper
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 300,
              maxHeight: "calc(100vh - 100px)",
              overflow: "auto",
              zIndex: 1000,
              p: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Информация об объекте
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {selectedFeature ? (
              <Box>
                {/* Заголовок с именем слоя */}
                <Typography variant="h6" gutterBottom>
                  {import.meta.env.VITE_DEFAULT_LAYER_NAME || "Объект"}
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {/* Координаты */}
                {selectedFeature.geometry && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Координаты:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: "monospace" }}
                    >
                      {selectedFeature.geometry.type === "Point"
                        ? `[${(
                            selectedFeature.geometry.coordinates as [
                              number,
                              number
                            ]
                          ).join(", ")}]`
                        : JSON.stringify(selectedFeature.geometry.coordinates)}
                    </Typography>
                  </Box>
                )}

                {/* Свойства объекта */}
                <Typography variant="subtitle2" gutterBottom>
                  Свойства объекта:
                </Typography>

                {Object.entries(selectedFeature.properties).map(
                  ([key, value]) => (
                    <Box key={key} sx={{ mb: 1 }}>
                      <Typography
                        variant="body2"
                        component="span"
                        sx={{ fontWeight: "bold" }}
                      >
                        {key}:
                      </Typography>
                      <Typography
                        variant="body2"
                        component="span"
                        sx={{ ml: 1 }}
                      >
                        {String(value)}
                      </Typography>
                    </Box>
                  )
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Кликните на объект на карте для получения информации
              </Typography>
            )}
          </Paper>
        )}
      </Box>

      <Drawer
        anchor="right"
        open={layersOpen}
        onClose={toggleLayers}
        sx={{
          "& .MuiDrawer-paper": {
            width: 300,
            p: 2,
          },
        }}
      >
        <Typography variant="h6" gutterBottom>
          Управление слоями
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <List>
          <ListItem>
            <FormControlLabel
              control={
                <Switch
                  checked={selectedLayers.wms}
                  onChange={() => handleLayerToggle("wms")}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: "#4caf50",
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: "#4caf50",
                    },
                  }}
                />
              }
              label={`WMS слои ${
                selectedLayers.wms ? "(включен)" : "(выключен)"
              }`}
            />
          </ListItem>
          <ListItem>
            <FormControlLabel
              control={
                <Switch
                  checked={selectedLayers.wfs}
                  onChange={() => handleLayerToggle("wfs")}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: "#2196f3",
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: "#2196f3",
                    },
                  }}
                />
              }
              label={`WFS слои ${
                selectedLayers.wfs ? "(включен)" : "(выключен)"
              }`}
            />
          </ListItem>
          <ListItem>
            <FormControlLabel
              control={
                <Switch
                  checked={selectedLayers.zws}
                  onChange={() => handleLayerToggle("zws")}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: "#ff9800",
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: "#ff9800",
                    },
                  }}
                />
              }
              label={`ZWS слои ${
                selectedLayers.zws ? "(включен)" : "(выключен)"
              }`}
            />
          </ListItem>
        </List>
      </Drawer>
    </Box>
  );
}

export default App;
