/**
 * Caloric expenditure calculations based on exercise MET, body weight,
 * active movement duration, rep speed/tempo, and range of motion.
 */

export interface CalorieCalculationParams {
  metValue: number;
  weightKg: number;
  activeSeconds: number; // Duration spent in active eccentric/concentric movement
  tempoMultiplier?: number; // 0.8 to 1.25 based on rep speed
  romMultiplier?: number; // 0.8 to 1.15 based on completeness of joint range of motion
}

/**
 * Calculates estimated calories burned.
 * Formula: MET × weight (kg) × active time (hours) × tempo × ROM.
 */
export function calculateCaloriesBurned({
  metValue,
  weightKg,
  activeSeconds,
  tempoMultiplier = 1.0,
  romMultiplier = 1.0,
}: CalorieCalculationParams): number {
  if (weightKg <= 0 || activeSeconds <= 0 || metValue <= 0) {
    return 0;
  }

  const activeHours = activeSeconds / 3600;
  const clampedTempo = Math.max(0.7, Math.min(1.4, tempoMultiplier));
  const clampedRom = Math.max(0.7, Math.min(1.3, romMultiplier));

  const calories = metValue * weightKg * activeHours * clampedTempo * clampedRom;
  return Math.round(calories * 10) / 10;
}

/**
 * Helper to convert pounds to kilograms
 */
export function lbToKg(lb: number): number {
  return Math.round((lb * 0.45359237) * 10) / 10;
}

/**
 * Helper to convert kilograms to pounds
 */
export function kgToLb(kg: number): number {
  return Math.round((kg * 2.20462) * 10) / 10;
}
