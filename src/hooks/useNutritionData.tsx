import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { Database } from "@/types/database";
import { toast } from "sonner";

type DietType = Database["public"]["Tables"]["diet_types"]["Row"];
type PatientDiet = Database["public"]["Tables"]["patient_diets"]["Row"];
type FoodAllergy = Database["public"]["Tables"]["food_allergies"]["Row"];
type MealPlan = Database["public"]["Tables"]["meal_plans"]["Row"];
type MealRecord = Database["public"]["Tables"]["meal_records"]["Row"];

export function useNutritionData() {
  const queryClient = useQueryClient();

  // Fetch diet types
  const { data: dietTypes, isLoading: loadingDietTypes } = useQuery({
    queryKey: ["diet-types"],
    queryFn: async () => {
      const { data, error } = await db
        .from("diet_types")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as DietType[];
    },
  });

  // Fetch patient diets with patient info
  const { data: patientDiets, isLoading: loadingPatientDiets } = useQuery({
    queryKey: ["patient-diets"],
    queryFn: async () => {
      const { data, error } = await db
        .from("patient_diets")
        .select(`
          *,
          patients:patient_id (full_name, medical_record_number),
          diet_types:diet_type_id (name, category)
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch food allergies
  const { data: foodAllergies, isLoading: loadingAllergies } = useQuery({
    queryKey: ["food-allergies"],
    queryFn: async () => {
      const { data, error } = await db
        .from("food_allergies")
        .select(`
          *,
          patients:patient_id (full_name, medical_record_number)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch today's meal plans
  const { data: todayMealPlans, isLoading: loadingMealPlans } = useQuery({
    queryKey: ["today-meal-plans"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await db
        .from("meal_plans")
        .select(`
          *,
          patient_diets:patient_diet_id (
            patient_id,
            diet_name,
            patients:patient_id (full_name, medical_record_number)
          )
        `)
        .eq("meal_date", today)
        .order("meal_type");
      if (error) throw error;
      return data;
    },
  });

  // Fetch meal records
  const { data: mealRecords, isLoading: loadingMealRecords } = useQuery({
    queryKey: ["meal-records"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await db
        .from("meal_records")
        .select(`
          *,
          patients:patient_id (full_name, medical_record_number)
        `)
        .eq("meal_date", today)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Create patient diet
  const createPatientDiet = useMutation({
    mutationFn: async (diet: Database["public"]["Tables"]["patient_diets"]["Insert"]) => {
      const { data, error } = await db
        .from("patient_diets")
        .insert(diet)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-diets"] });
      toast.success("Diet pasien berhasil ditambahkan");
    },
    onError: (error) => {
      toast.error("Gagal menambah diet pasien: " + error.message);
    },
  });

  // Record food allergy
  const recordFoodAllergy = useMutation({
    mutationFn: async (allergy: Database["public"]["Tables"]["food_allergies"]["Insert"]) => {
      const { data, error } = await db
        .from("food_allergies")
        .insert(allergy)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-allergies"] });
      toast.success("Alergi makanan berhasil dicatat");
    },
    onError: (error) => {
      toast.error("Gagal mencatat alergi: " + error.message);
    },
  });

  // Record meal consumption
  const recordMealConsumption = useMutation({
    mutationFn: async (record: Database["public"]["Tables"]["meal_records"]["Insert"]) => {
      const { data, error } = await db
        .from("meal_records")
        .insert(record)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal-records"] });
      toast.success("Konsumsi makanan berhasil dicatat");
    },
    onError: (error) => {
      toast.error("Gagal mencatat konsumsi: " + error.message);
    },
  });

  return {
    dietTypes,
    patientDiets,
    foodAllergies,
    todayMealPlans,
    mealRecords,
    loadingDietTypes,
    loadingPatientDiets,
    loadingAllergies,
    loadingMealPlans,
    loadingMealRecords,
    createPatientDiet,
    recordFoodAllergy,
    recordMealConsumption,
  };
}
