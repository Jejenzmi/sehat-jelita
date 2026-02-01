import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { 
  usePerformanceReviews, 
  useEmployees, 
  useAddPerformanceReview,
  PerformanceReview
} from "@/hooks/useHRData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Plus, Star, Eye, TrendingUp } from "lucide-react";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

export function PerformanceTab() {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
  const [kpiScore, setKpiScore] = useState([70]);
  const [competencyScore, setCompetencyScore] = useState([70]);
  const [behaviorScore, setBehaviorScore] = useState([70]);
  
  const { data: reviews, isLoading } = usePerformanceReviews(selectedYear);
  const { data: employees } = useEmployees();
  const addReview = useAddPerformanceReview();

  const calculateOverallScore = () => {
    // Weighted average: KPI 50%, Competency 30%, Behavior 20%
    return Math.round(kpiScore[0] * 0.5 + competencyScore[0] * 0.3 + behaviorScore[0] * 0.2);
  };

  const getRating = (score: number): string => {
    if (score >= 90) return "outstanding";
    if (score >= 80) return "exceeds_expectations";
    if (score >= 60) return "meets_expectations";
    if (score >= 40) return "needs_improvement";
    return "unsatisfactory";
  };

  const getRatingLabel = (rating: string) => {
    const labels: Record<string, string> = {
      outstanding: "Sangat Baik",
      exceeds_expectations: "Melampaui Harapan",
      meets_expectations: "Memenuhi Harapan",
      needs_improvement: "Perlu Perbaikan",
      unsatisfactory: "Tidak Memuaskan",
    };
    return labels[rating] || rating;
  };

  const getRatingBadge = (rating?: string) => {
    if (!rating) return null;
    
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      outstanding: "default",
      exceeds_expectations: "default",
      meets_expectations: "secondary",
      needs_improvement: "outline",
      unsatisfactory: "destructive",
    };
    
    return <Badge variant={variants[rating] || "outline"}>{getRatingLabel(rating)}</Badge>;
  };

  const handleAddReview = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const overallScore = calculateOverallScore();
    
    addReview.mutate({
      employee_id: formData.get("employee_id") as string,
      review_period: formData.get("review_period") as string,
      review_year: parseInt(formData.get("review_year") as string),
      review_date: formData.get("review_date") as string,
      kpi_score: kpiScore[0],
      competency_score: competencyScore[0],
      behavior_score: behaviorScore[0],
      overall_score: overallScore,
      rating: getRating(overallScore),
      strengths: formData.get("strengths") as string || undefined,
      areas_for_improvement: formData.get("areas_for_improvement") as string || undefined,
      goals_next_period: formData.get("goals_next_period") as string || undefined,
      status: "submitted",
    }, {
      onSuccess: () => {
        setIsAddOpen(false);
        setKpiScore([70]);
        setCompetencyScore([70]);
        setBehaviorScore([70]);
      },
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const activeEmployees = employees?.filter(e => e.status === "active");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Penilaian Kinerja
            </CardTitle>
            <CardDescription>Kelola penilaian kinerja karyawan</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select 
              value={selectedYear.toString()} 
              onValueChange={(v) => setSelectedYear(parseInt(v))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Penilaian
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Penilaian Kinerja Baru</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4">
                  <form onSubmit={handleAddReview} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="employee_id">Karyawan *</Label>
                        <Select name="employee_id" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Karyawan" />
                          </SelectTrigger>
                          <SelectContent>
                            {activeEmployees?.map((emp) => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="review_date">Tanggal Penilaian *</Label>
                        <Input 
                          id="review_date" 
                          name="review_date" 
                          type="date"
                          defaultValue={format(new Date(), "yyyy-MM-dd")}
                          required 
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="review_period">Periode Penilaian *</Label>
                        <Select name="review_period" defaultValue="semester1">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="semester1">Semester 1</SelectItem>
                            <SelectItem value="semester2">Semester 2</SelectItem>
                            <SelectItem value="annual">Tahunan</SelectItem>
                            <SelectItem value="probation">Masa Percobaan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="review_year">Tahun *</Label>
                        <Select name="review_year" defaultValue={currentYear.toString()}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium">Skor Penilaian</h4>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>KPI (50%)</Label>
                          <span className={`font-medium ${getScoreColor(kpiScore[0])}`}>
                            {kpiScore[0]}
                          </span>
                        </div>
                        <Slider
                          value={kpiScore}
                          onValueChange={setKpiScore}
                          max={100}
                          step={1}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Kompetensi (30%)</Label>
                          <span className={`font-medium ${getScoreColor(competencyScore[0])}`}>
                            {competencyScore[0]}
                          </span>
                        </div>
                        <Slider
                          value={competencyScore}
                          onValueChange={setCompetencyScore}
                          max={100}
                          step={1}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Perilaku (20%)</Label>
                          <span className={`font-medium ${getScoreColor(behaviorScore[0])}`}>
                            {behaviorScore[0]}
                          </span>
                        </div>
                        <Slider
                          value={behaviorScore}
                          onValueChange={setBehaviorScore}
                          max={100}
                          step={1}
                        />
                      </div>
                      
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Skor Keseluruhan:</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xl font-bold ${getScoreColor(calculateOverallScore())}`}>
                              {calculateOverallScore()}
                            </span>
                            {getRatingBadge(getRating(calculateOverallScore()))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="strengths">Kekuatan</Label>
                      <Textarea id="strengths" name="strengths" rows={2} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="areas_for_improvement">Area yang Perlu Ditingkatkan</Label>
                      <Textarea id="areas_for_improvement" name="areas_for_improvement" rows={2} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="goals_next_period">Target Periode Berikutnya</Label>
                      <Textarea id="goals_next_period" name="goals_next_period" rows={2} />
                    </div>
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                        Batal
                      </Button>
                      <Button type="submit" disabled={addReview.isPending}>
                        {addReview.isPending ? "Menyimpan..." : "Simpan"}
                      </Button>
                    </DialogFooter>
                  </form>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Karyawan</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-center">KPI</TableHead>
                <TableHead className="text-center">Kompetensi</TableHead>
                <TableHead className="text-center">Perilaku</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews?.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{(review.employees as any)?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(review.employees as any)?.position}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {review.review_period === "semester1" ? "Semester 1" : 
                     review.review_period === "semester2" ? "Semester 2" : 
                     review.review_period === "annual" ? "Tahunan" : review.review_period} {review.review_year}
                  </TableCell>
                  <TableCell>
                    {format(new Date(review.review_date), "dd MMM yyyy", { locale: id })}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={getScoreColor(review.kpi_score)}>{review.kpi_score}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={getScoreColor(review.competency_score)}>{review.competency_score}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={getScoreColor(review.behavior_score)}>{review.behavior_score}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-bold ${getScoreColor(review.overall_score)}`}>
                      {review.overall_score}
                    </span>
                  </TableCell>
                  <TableCell>{getRatingBadge(review.rating)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setSelectedReview(review);
                        setIsViewOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {reviews?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    Tidak ada data penilaian untuk tahun {selectedYear}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Penilaian Kinerja</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Karyawan</p>
                    <p className="font-medium">{(selectedReview.employees as any)?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Periode</p>
                    <p className="font-medium">{selectedReview.review_period} {selectedReview.review_year}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">KPI (50%)</span>
                    <span className={`font-medium ${getScoreColor(selectedReview.kpi_score)}`}>
                      {selectedReview.kpi_score}
                    </span>
                  </div>
                  <Progress value={selectedReview.kpi_score} />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Kompetensi (30%)</span>
                    <span className={`font-medium ${getScoreColor(selectedReview.competency_score)}`}>
                      {selectedReview.competency_score}
                    </span>
                  </div>
                  <Progress value={selectedReview.competency_score} />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Perilaku (20%)</span>
                    <span className={`font-medium ${getScoreColor(selectedReview.behavior_score)}`}>
                      {selectedReview.behavior_score}
                    </span>
                  </div>
                  <Progress value={selectedReview.behavior_score} />
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="font-medium">Skor Keseluruhan</span>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${getScoreColor(selectedReview.overall_score)}`}>
                    {selectedReview.overall_score}
                  </span>
                  {getRatingBadge(selectedReview.rating)}
                </div>
              </div>

              {selectedReview.strengths && (
                <div>
                  <h4 className="font-medium mb-1">Kekuatan</h4>
                  <p className="text-sm text-muted-foreground">{selectedReview.strengths}</p>
                </div>
              )}

              {selectedReview.areas_for_improvement && (
                <div>
                  <h4 className="font-medium mb-1">Area yang Perlu Ditingkatkan</h4>
                  <p className="text-sm text-muted-foreground">{selectedReview.areas_for_improvement}</p>
                </div>
              )}

              {selectedReview.goals_next_period && (
                <div>
                  <h4 className="font-medium mb-1">Target Periode Berikutnya</h4>
                  <p className="text-sm text-muted-foreground">{selectedReview.goals_next_period}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
