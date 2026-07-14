import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Loader2, Save, RefreshCw } from "lucide-react";
import api from "../../lib/api";

export default function Settings() {
  const qc = useQueryClient();
  const [colors, setColors] = useState({
    primary: "#1A1A2E",
    "primary-light": "#2D2D44",
    accent: "#C9A84C",
    "accent-light": "#E8D48B",
    success: "#2D8659",
    danger: "#B85450",
    info: "#2B6A8F",
    "bg-page": "#F5F4F0",
  });
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [appName, setAppName] = useState("");
  const [mapWidth, setMapWidth] = useState("");
  const [mapHeight, setMapHeight] = useState("");
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<Record<string, string>>("/settings").then((r) => r.data),
  });

  useEffect(() => {
    if (settings) {
      setColors({
        primary: settings.primary || "#354337",
        "primary-light": settings["primary-light"] || "#354337",
        accent: settings.accent || "#E14029",
        "accent-light": settings["accent-light"] || "#F5F8F5",
        success: settings.success || "#2D8659",
        danger: settings.danger || "#B85450",
        info: settings.info || "#2B6A8F",
        "bg-page": settings["bg-page"] || "#F5F8F5",
      });
      setLogoUrl(settings.logoUrl || "");
      setFaviconUrl(settings.faviconUrl || "");
      setAppName(settings.appName || "");
      setMapWidth(settings.mapWidth || "");
      setMapHeight(settings.mapHeight || "");
    }
  }, [settings]);

  const updateSettings = useMutation({
    mutationFn: (data: Record<string, string>) => api.put("/settings/bulk", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const applyColorsPreview = () => {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(colors)) {
      root.style.setProperty(`--color-${key}`, value);
    }
  };

  const handleSave = () => {
    applyColorsPreview();
    updateSettings.mutate({
      ...colors,
      logoUrl,
      faviconUrl,
      appName,
      mapWidth,
      mapHeight,
    });
  };

  const handleReset = () => {
    setColors({
      primary: "#1A1A2E",
      "primary-light": "#2D2D44",
      accent: "#C9A84C",
      "accent-light": "#E8D48B",
      success: "#2D8659",
      danger: "#B85450",
      info: "#2B6A8F",
      "bg-page": "#F5F4F0",
    });
    setLogoUrl("");
    setFaviconUrl("");
    setAppName("");
    setMapWidth("");
    setMapHeight("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-display text-primary">Personalizar</h1>
        <p className="text-xs sm:text-sm text-muted mt-1">Configure as cores, logotipo e nome do sistema</p>
      </div>

      <Card className="border border-border">
        <CardHeader>
          <h2 className="font-serif font-medium">Cores do Tema</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(colors).map(([key, value]) => (
            <div key={key} className="flex items-center gap-3">
              <label className="w-28 sm:w-36 text-sm text-muted capitalize">
                {key.replace(/-/g, " ")}
              </label>
              <div className="relative">
                <input
                  type="color"
                  value={value}
                  onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                  className="w-10 h-10 rounded-md border border-border cursor-pointer bg-transparent"
                />
              </div>
              <input
                type="text"
                value={value}
                onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                className="flex-1 h-10 px-3 rounded-md border border-border bg-surface text-sm font-mono"
              />
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            {Object.entries(colors).map(([key, value]) => (
              <div
                key={key}
                className="w-6 h-6 rounded-md border border-border"
                style={{ backgroundColor: value }}
                title={key}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardHeader>
          <h2 className="font-serif font-medium">Logotipo e Identidade</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Nome do sistema"
            id="appName"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="easyDesky"
          />

          <div>
            <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
              URL do Logotipo
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="flex-1 h-10 px-3 rounded-md border border-border bg-surface text-sm"
                placeholder="https://exemplo.com/simoes_logo.png"
              />
            </div>
            {logoUrl && (
              <div className="mt-2 p-3 rounded-md bg-[#F5F4F0] flex items-center gap-3">
                <img src={logoUrl} alt="Preview logo" className="h-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <span className="text-xs text-muted">Preview</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
              URL do Favicon
            </label>
            <input
              type="text"
              value={faviconUrl}
              onChange={(e) => setFaviconUrl(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm"
              placeholder="https://exemplo.com/favicon.ico"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardHeader>
          <h2 className="font-serif font-medium">Mapa</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Largura do SVG (px)"
            id="mapWidth"
            type="number"
            value={mapWidth}
            onChange={(e) => setMapWidth(e.target.value)}
            placeholder="ex: 800"
          />
          <Input
            label="Altura do SVG (px)"
            id="mapHeight"
            type="number"
            value={mapHeight}
            onChange={(e) => setMapHeight(e.target.value)}
            placeholder="ex: 600"
          />
          <p className="text-xs text-muted">Deixe em branco para calcular automaticamente com base nas mesas.</p>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={updateSettings.isPending} variant="primary">
          <Save size={16} className="mr-1" />
          {updateSettings.isPending ? "Salvando..." : saved ? "Salvo!" : "Salvar"}
        </Button>
        <Button onClick={handleReset} variant="outline">
          <RefreshCw size={16} className="mr-1" /> Restaurar padrão
        </Button>
      </div>
    </div>
  );
}
