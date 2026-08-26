export const INDUSTRIES = [
  "Technology",
  "Healthcare & life sciences",
  "Financial services",
  "Education",
  "Professional services",
  "Construction & engineering",
  "Manufacturing",
  "Retail & e-commerce",
  "Government & public sector",
  "Nonprofit",
  "Media & entertainment",
  "Real estate",
  "Energy & utilities",
  "Transportation & logistics",
  "Hospitality & travel",
  "Telecommunications",
  "Consumer goods",
  "Agriculture",
  "Legal",
  "Other",
] as const;

export type Industry = (typeof INDUSTRIES)[number];

const INDUSTRY_SET = new Set<string>(INDUSTRIES);

export function isIndustry(value: string): value is Industry {
  return INDUSTRY_SET.has(value);
}
