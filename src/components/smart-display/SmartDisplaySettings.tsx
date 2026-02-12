import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, ShieldCheck, Upload, Trash2, ImageIcon, Video, Type } from "lucide-react";
import { useSmartDisplayConfig, useUpdateSmartDisplayConfig } from "@/hooks/useSmartDisplayConfig";
import { useSmartDisplayMedia, useUploadSmartDisplayMedia, useDeleteSmartDisplayMedia, SmartDisplayMedia } from "@/hooks/useSmartDisplayMedia";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SmartDisplaySettings({ open, onOpenChange }: Props) {
  const { data: config, isLoading } = useSmartDisplayConfig("lobby");
  const updateConfig = useUpdateSmartDisplayConfig();
  const { data: images = [] } = useSmartDisplayMedia("lobby", "image");
  const { data: videos = [] } = useSmartDisplayMedia("lobby", "video");
  const uploadMedia = useUploadSmartDisplayMedia();
  const deleteMedia = useDeleteSmartDisplayMedia();

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = (files: FileList | null, mediaType: "image" | "video") => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      uploadMedia.mutate({ file, displayType: "lobby", mediaType });
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Pengaturan Smart Display
          </DialogTitle>
          <p className="text-xs text-muted-foreground">Kelola konten Running Text, Gambar Slide, dan Video</p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="text" className="gap-1 text-xs"><Type className="h-3.5 w-3.5" /> Running Text</TabsTrigger>
              <TabsTrigger value="images" className="gap-1 text-xs"><ImageIcon className="h-3.5 w-3.5" /> Gambar</TabsTrigger>
              <TabsTrigger value="videos" className="gap-1 text-xs"><Video className="h-3.5 w-3.5" /> Video</TabsTrigger>
              <TabsTrigger value="general" className="gap-1 text-xs"><ShieldCheck className="h-3.5 w-3.5" /> Umum</TabsTrigger>
            </TabsList>

            {/* Running Text Tab */}
            <TabsContent value="text" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Aktifkan Running Text</Label>
                <Switch checked={form.running_text_enabled} onCheckedChange={(v) => setForm(f => ({ ...f, running_text_enabled: v }))} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  Pisahkan setiap pesan dengan baris baru (Enter). Setiap baris akan menjadi satu item running text.
                </Label>
                <Textarea
                  value={form.running_text}
                  onChange={(e) => setForm(f => ({ ...f, running_text: e.target.value }))}
                  placeholder={"🏥 Selamat datang di Rumah Sakit\n📋 Pendaftaran online tersedia\n⏰ Jam Besuk: 10.00-12.00 WIB"}
                  rows={6}
                />
              </div>
              <Button onClick={handleSave} disabled={updateConfig.isPending} className="w-full">
                {updateConfig.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Simpan Running Text
              </Button>
            </TabsContent>

            {/* Images Tab */}
            <TabsContent value="images" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Slideshow Gambar</Label>
                <Switch checked={form.slideshow_enabled} onCheckedChange={(v) => setForm(f => ({ ...f, slideshow_enabled: v }))} />
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Interval (detik)</Label>
                <Input
                  type="number" min={2} max={30}
                  value={form.slideshow_interval}
                  onChange={(e) => setForm(f => ({ ...f, slideshow_interval: parseInt(e.target.value) || 5 }))}
                  className="w-20"
                />
              </div>

              <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => handleFileUpload(e.target.files, "image")} />

              <Button variant="outline" className="w-full" onClick={() => imageInputRef.current?.click()} disabled={uploadMedia.isPending}>
                {uploadMedia.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                Upload Gambar Slide
              </Button>

              <MediaList items={images} onDelete={(item) => deleteMedia.mutate(item)} deleting={deleteMedia.isPending} type="image" />

              <Button onClick={handleSave} disabled={updateConfig.isPending} size="sm" variant="secondary" className="w-full">
                <Save className="h-4 w-4 mr-2" /> Simpan Pengaturan Slideshow
              </Button>
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Video Player</Label>
                <Switch checked={form.video_enabled} onCheckedChange={(v) => setForm(f => ({ ...f, video_enabled: v }))} />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Auto Play</Label>
                <Switch checked={form.video_auto_play} onCheckedChange={(v) => setForm(f => ({ ...f, video_auto_play: v }))} />
              </div>

              <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden"
                onChange={(e) => handleFileUpload(e.target.files, "video")} />

              <Button variant="outline" className="w-full" onClick={() => videoInputRef.current?.click()} disabled={uploadMedia.isPending}>
                {uploadMedia.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                Upload Video
              </Button>

              <MediaList items={videos} onDelete={(item) => deleteMedia.mutate(item)} deleting={deleteMedia.isPending} type="video" />

              <Button onClick={handleSave} disabled={updateConfig.isPending} size="sm" variant="secondary" className="w-full">
                <Save className="h-4 w-4 mr-2" /> Simpan Pengaturan Video
              </Button>
            </TabsContent>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Auto Refresh</Label>
                <Switch checked={form.auto_refresh} onCheckedChange={(v) => setForm(f => ({ ...f, auto_refresh: v }))} />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Interval (detik)</Label>
                <Input
                  type="number" min={10} max={120}
                  value={form.auto_refresh_interval}
                  onChange={(e) => setForm(f => ({ ...f, auto_refresh_interval: parseInt(e.target.value) || 30 }))}
                  className="w-20"
                />
              </div>
              <Button onClick={handleSave} disabled={updateConfig.isPending} className="w-full">
                {updateConfig.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Simpan Pengaturan
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MediaList({ items, onDelete, deleting, type }: {
  items: SmartDisplayMedia[];
  onDelete: (item: SmartDisplayMedia) => void;
  deleting: boolean;
  type: "image" | "video";
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
        {type === "image" ? <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-40" /> : <Video className="h-8 w-8 mx-auto mb-2 opacity-40" />}
        <p className="text-sm">Belum ada {type === "image" ? "gambar" : "video"} yang diupload</p>
        <p className="text-xs mt-1">Klik tombol upload di atas untuk menambahkan</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg border bg-muted/30">
          {type === "image" ? (
            <img src={item.file_url} alt={item.title || ""} className="w-16 h-10 object-cover rounded" />
          ) : (
            <div className="w-16 h-10 bg-muted rounded flex items-center justify-center">
              <Video className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.title || item.file_name}</p>
            <p className="text-[10px] text-muted-foreground">{item.file_name}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
            onClick={() => onDelete(item)} disabled={deleting}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
