import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, ShieldCheck } from "lucide-react";
import { useSmartDisplayConfig, useUpdateSmartDisplayConfig } from "@/hooks/useSmartDisplayConfig";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SmartDisplaySettings({ open, onOpenChange }: Props) {
  const { data: config, isLoading } = useSmartDisplayConfig("lobby");
  const updateConfig = useUpdateSmartDisplayConfig();

  const [form, setForm] = useState({
    running_text: "",
    running_text_enabled: true,
    slideshow_enabled: true,
    slideshow_interval: 5,
    video_enabled: true,
    video_auto_play: true,
    auto_refresh: true,
    auto_refresh_interval: 30,
  });

  useEffect(() => {
    if (config) {
      setForm({
        running_text: config.running_text || "",
        running_text_enabled: config.running_text_enabled,
        slideshow_enabled: config.slideshow_enabled,
        slideshow_interval: config.slideshow_interval,
        video_enabled: config.video_enabled,
        video_auto_play: config.video_auto_play,
        auto_refresh: config.auto_refresh,
        auto_refresh_interval: config.auto_refresh_interval,
      });
    }
  }, [config]);

  const handleSave = () => {
    if (!config?.id) return;
    updateConfig.mutate({ id: config.id, ...form }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Pengaturan Smart Display
          </DialogTitle>
          <p className="text-xs text-muted-foreground">Hanya Admin & Manajemen yang dapat mengakses pengaturan ini</p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="space-y-5">
            {/* Running Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Running Text</Label>
                <Switch checked={form.running_text_enabled} onCheckedChange={(v) => setForm(f => ({ ...f, running_text_enabled: v }))} />
              </div>
              <Textarea
                value={form.running_text}
                onChange={(e) => setForm(f => ({ ...f, running_text: e.target.value }))}
                placeholder="Teks berjalan di layar lobby..."
                rows={2}
              />
            </div>

            {/* Slideshow */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Slideshow Gambar</Label>
                <Switch checked={form.slideshow_enabled} onCheckedChange={(v) => setForm(f => ({ ...f, slideshow_enabled: v }))} />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Interval (detik)</Label>
                <Input
                  type="number"
                  min={2}
                  max={30}
                  value={form.slideshow_interval}
                  onChange={(e) => setForm(f => ({ ...f, slideshow_interval: parseInt(e.target.value) || 5 }))}
                  className="w-20"
                />
              </div>
            </div>

            {/* Video */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Video Player</Label>
                <Switch checked={form.video_enabled} onCheckedChange={(v) => setForm(f => ({ ...f, video_enabled: v }))} />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Auto Play</Label>
                <Switch checked={form.video_auto_play} onCheckedChange={(v) => setForm(f => ({ ...f, video_auto_play: v }))} />
              </div>
            </div>

            {/* Auto Refresh */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Auto Refresh</Label>
                <Switch checked={form.auto_refresh} onCheckedChange={(v) => setForm(f => ({ ...f, auto_refresh: v }))} />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Interval (detik)</Label>
                <Input
                  type="number"
                  min={10}
                  max={120}
                  value={form.auto_refresh_interval}
                  onChange={(e) => setForm(f => ({ ...f, auto_refresh_interval: parseInt(e.target.value) || 30 }))}
                  className="w-20"
                />
              </div>
            </div>

            <Button onClick={handleSave} disabled={updateConfig.isPending} className="w-full">
              {updateConfig.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Simpan Pengaturan
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
