import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface YearFilterProps {
  years: number[];
  selectedYear: string;
  onYearChange: (year: string) => void;
}

export const YearFilter = ({ years, selectedYear, onYearChange }: YearFilterProps) => {
  const uniqueYears = [...new Set(years)].sort((a, b) => b - a);

  return (
    <Select value={selectedYear} onValueChange={onYearChange}>
      <SelectTrigger className="w-[120px] h-9 bg-background/50 border-border/50">
        <SelectValue placeholder="All Years" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Years</SelectItem>
        {uniqueYears.map((year) => (
          <SelectItem key={year} value={year.toString()}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
