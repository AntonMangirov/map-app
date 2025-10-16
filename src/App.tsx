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

function App() {
  const [layersOpen, setLayersOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [selectedLayers, setSelectedLayers] = useState({
    wms: true,
    wfs: false,
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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* AppBar */}
      <AppBar position="static" sx={{ zIndex: 1300 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Картографическое приложение
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

      {/* Основной контент */}
      <Box sx={{ display: "flex", flexGrow: 1, position: "relative" }}>
        {/* Карта */}
        <Box
          id="map"
          sx={{
            flexGrow: 1,
            height: "100%",
            width: "100%",
          }}
        />

        {/* Информационная панель */}
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
            <Typography variant="body2" color="text.secondary">
              Кликните на объект на карте для получения информации
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Drawer для управления слоями */}
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
                />
              }
              label="WMS слои"
            />
          </ListItem>
          <ListItem>
            <FormControlLabel
              control={
                <Switch
                  checked={selectedLayers.wfs}
                  onChange={() => handleLayerToggle("wfs")}
                />
              }
              label="WFS слои"
            />
          </ListItem>
          <ListItem>
            <FormControlLabel
              control={
                <Switch
                  checked={selectedLayers.zws}
                  onChange={() => handleLayerToggle("zws")}
                />
              }
              label="ZWS слои"
            />
          </ListItem>
        </List>
      </Drawer>
    </Box>
  );
}

export default App;
