import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Users, RotateCw, FlaskConical, Calendar } from "lucide-react";
import EducationPrograms from "@/components/education/EducationPrograms";
import MedicalTrainees from "@/components/education/MedicalTrainees";
import ClinicalRotations from "@/components/education/ClinicalRotations";
import ResearchProjects from "@/components/education/ResearchProjects";
import AcademicActivities from "@/components/education/AcademicActivities";

export default function Pendidikan() {
  const [activeTab, setActiveTab] = useState("programs");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pendidikan & Penelitian</h1>
        <p className="text-muted-foreground">Manajemen program pendidikan, residen, rotasi klinik, dan proyek penelitian</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="programs" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Program</span>
          </TabsTrigger>
          <TabsTrigger value="trainees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Residen</span>
          </TabsTrigger>
          <TabsTrigger value="rotations" className="flex items-center gap-2">
            <RotateCw className="h-4 w-4" />
            <span className="hidden sm:inline">Rotasi</span>
          </TabsTrigger>
          <TabsTrigger value="research" className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            <span className="hidden sm:inline">Penelitian</span>
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Kegiatan</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="mt-6">
          <EducationPrograms />
        </TabsContent>

        <TabsContent value="trainees" className="mt-6">
          <MedicalTrainees />
        </TabsContent>

        <TabsContent value="rotations" className="mt-6">
          <ClinicalRotations />
        </TabsContent>

        <TabsContent value="research" className="mt-6">
          <ResearchProjects />
        </TabsContent>

        <TabsContent value="activities" className="mt-6">
          <AcademicActivities />
        </TabsContent>
      </Tabs>
    </div>
  );
}
