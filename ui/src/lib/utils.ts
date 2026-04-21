import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function biasScoreColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-danger";
}

export function biasScoreBg(score: number): string {
  if (score >= 80) return "bg-success-dim border-success/20";
  if (score >= 60) return "bg-warning-dim border-warning/20";
  return "bg-danger-dim border-danger/20";
}

export function severityColor(severity: "High" | "Medium" | "Low"): string {
  if (severity === "High") return "text-danger bg-danger-dim border-danger/20";
  if (severity === "Medium") return "text-warning bg-warning-dim border-warning/20";
  return "text-success bg-success-dim border-success/20";
}
