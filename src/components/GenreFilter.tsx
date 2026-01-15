import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export const genres = [
    "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery", "Romance", "Sci-Fi", "TV Series", "Thriller", "War", "Western"
];

interface GenreFilterProps {
    selectedGenre: string | null;
    onSelectGenre: (genre: string | null) => void;
}

export function GenreFilter({ selectedGenre, onSelectGenre }: GenreFilterProps) {
    return (
        <Select value={selectedGenre || "all"} onValueChange={(val) => onSelectGenre(val === "all" ? null : val)}>
            <SelectTrigger className="w-[180px] bg-background/50 backdrop-blur-sm border-white/10">
                <SelectValue placeholder="Genre" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                {genres.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
