// Verified local posters downloaded from Google Images
import theBatmanPoster from "@/assets/posters/the-batman.jpg";
import oppenheimerPoster from "@/assets/posters/oppenheimer.jpg";
import dunePoster from "@/assets/posters/dune-part-two.jpg";
import oldboyPoster from "@/assets/posters/oldboy.jpg";
import yourNamePoster from "@/assets/posters/your-name.jpg";
import neZhaPoster from "@/assets/posters/ne-zha.jpg";
import parasitePoster from "@/assets/posters/parasite.jpg";
import spiritedAwayPoster from "@/assets/posters/spirited-away.jpg";
import detectiveChinatown3Poster from "@/assets/posters/detective-chinatown-3.jpg";
// Special high-quality posters for top movies
import interstellarPoster from "@/assets/posters/interstellar.jpg";
import darkKnightPoster from "@/assets/posters/dark-knight.jpg";
import inceptionPoster from "@/assets/posters/inception.jpg";
// Nollywood posters
import theBlackBookPoster from "@/assets/posters/the-black-book.jpg";
import anikulapoPoster from "@/assets/posters/anikulapo.jpg";
import kingOfThievesPoster from "@/assets/posters/king-of-thieves.jpg";
import gangsOfLagosPoster from "@/assets/posters/gangs-of-lagos.jpg";
import brotherhoodPoster from "@/assets/posters/brotherhood.jpg";
import jagunJagunPoster from "@/assets/posters/jagun-jagun.jpg";
import aTribeCalledJudahPoster from "@/assets/posters/a-tribe-called-judah.jpg";
// Hollywood posters
import avatarPoster from "@/assets/posters/avatar-way-of-water.jpg";
import topGunPoster from "@/assets/posters/top-gun-maverick.jpg";
import blackPantherPoster from "@/assets/posters/black-panther-wakanda.jpg";
import spidermanPoster from "@/assets/posters/spiderman-no-way-home.jpg";
// Bollywood posters
import pathaanPoster from "@/assets/posters/pathaan.jpg";
import jawanPoster from "@/assets/posters/jawan.jpg";
import rockyRaniPoster from "@/assets/posters/rocky-aur-rani.jpg";
import animalPoster from "@/assets/posters/animal.jpg";
import rrrPoster from "@/assets/posters/rrr.jpg";
import brahmastraPoster from "@/assets/posters/brahmastra.jpg";
import kgf2Poster from "@/assets/posters/kgf2.jpg";
// Korean posters
import squidGamePoster from "@/assets/posters/squid-game.jpg";
import trainToBusanPoster from "@/assets/posters/train-to-busan.jpg";
import handmaidenPoster from "@/assets/posters/handmaiden.jpg";
import memoriesOfMurderPoster from "@/assets/posters/memories-of-murder.jpg";
// Anime posters
import suzumePoster from "@/assets/posters/suzume.jpg";
import jujutsuKaisenPoster from "@/assets/posters/jujutsu-kaisen-0.jpg";
import demonSlayerPoster from "@/assets/posters/demon-slayer-mugen.jpg";
import weatheringPoster from "@/assets/posters/weathering-with-you.jpg";
// Chinese posters
import wanderingEarthPoster from "@/assets/posters/wandering-earth-2.jpg";
import hiMomPoster from "@/assets/posters/hi-mom.jpg";
import battleLakePoster from "@/assets/posters/battle-lake-changjin.jpg";
// European posters
import zoneOfInterestPoster from "@/assets/posters/zone-of-interest.jpg";
import anatomyOfFallPoster from "@/assets/posters/anatomy-of-fall.jpg";
import ameliePoster from "@/assets/posters/amelie.jpg";
import intouchablesPoster from "@/assets/posters/intouchables.jpg";
import pansLabyrinthPoster from "@/assets/posters/pans-labyrinth.jpg";
// Thriller posters
import se7enPoster from "@/assets/posters/se7en.jpg";
import goneGirlPoster from "@/assets/posters/gone-girl.jpg";
import prisonersPoster from "@/assets/posters/prisoners.jpg";
import shutterIslandPoster from "@/assets/posters/shutter-island.jpg";
import silenceOfLambsPoster from "@/assets/posters/silence-of-lambs.jpg";
import zodiacPoster from "@/assets/posters/zodiac.jpg";
import noCountryPoster from "@/assets/posters/no-country.jpg";
// TV Series posters
import strangerThingsPoster from "@/assets/posters/stranger-things.jpg";
import emilyInParisPoster from "@/assets/posters/emily-in-paris.jpg";
import falloutPoster from "@/assets/posters/fallout.jpg";
import percyJacksonPoster from "@/assets/posters/percy-jackson.jpg";
import theWitcherPoster from "@/assets/posters/the-witcher.jpg";
import wednesdayPoster from "@/assets/posters/wednesday.jpg";
// New TV Series posters
import houseOfDragonPoster from "@/assets/posters/house-of-dragon.jpg";
import lastOfUsPoster from "@/assets/posters/last-of-us.jpg";
import shogunPoster from "@/assets/posters/shogun.jpg";
import theBearPoster from "@/assets/posters/the-bear.jpg";
import severancePoster from "@/assets/posters/severance.jpg";
import theGentlemenPoster from "@/assets/posters/the-gentlemen.jpg";
import threeBodyProblemPoster from "@/assets/posters/3-body-problem.jpg";
import slowHorsesPoster from "@/assets/posters/slow-horses.jpg";
import thePenguinPoster from "@/assets/posters/the-penguin.jpg";
import babyReindeerPoster from "@/assets/posters/baby-reindeer.jpg";
import ripleyPoster from "@/assets/posters/ripley.jpg";
import darkMatterPoster from "@/assets/posters/dark-matter.jpg";
import trueDetectiveS4Poster from "@/assets/posters/true-detective-s4.jpg";
import reacherPoster from "@/assets/posters/reacher.jpg";
import pachinkoPoster from "@/assets/posters/pachinko.jpg";
import arcanePoster from "@/assets/posters/arcane.jpg";
import whiteLotusPoster from "@/assets/posters/white-lotus.jpg";
import yellowjacketsPoster from "@/assets/posters/yellowjackets.jpg";
import mrAndMrsSmithPoster from "@/assets/posters/mr-and-mrs-smith.jpg";
import hacksPoster from "@/assets/posters/hacks.jpg";
import theBoysPoster from "@/assets/posters/the-boys.jpg";
import siloPoster from "@/assets/posters/silo.jpg";
import ringsOfPowerPoster from "@/assets/posters/rings-of-power.jpg";

export interface Movie {
  id: string;
  title: string;
  year: number;
  poster: string;
  trailerUrl: string;
  genres?: string[];
}

export interface Category {
  id: string;
  name: string;
  movies: Movie[];
}

// Featured Categories - Latest and Trending
export const latestTrailers: Category = {
  id: "latest",
  name: "Latest Trailers",
  movies: [
    { id: "latest-1", title: "Severance", year: 2025, poster: severancePoster, trailerUrl: "https://www.youtube.com/watch?v=xEQP4VVuyrY", genres: ["Sci-Fi", "Drama", "Thriller"] },
    { id: "latest-2", title: "The Last of Us", year: 2025, poster: lastOfUsPoster, trailerUrl: "https://www.youtube.com/watch?v=uLtkt8BonwM", genres: ["Drama", "Action", "Horror"] },
    { id: "latest-3", title: "Squid Game S2", year: 2024, poster: squidGamePoster, trailerUrl: "https://www.youtube.com/watch?v=Ed1sGgHUo88", genres: ["Thriller", "Drama"] },
    { id: "latest-4", title: "Shogun", year: 2024, poster: shogunPoster, trailerUrl: "https://www.youtube.com/watch?v=HIs9x49DK7I", genres: ["History", "Drama", "War"] },
    { id: "latest-5", title: "House of the Dragon", year: 2024, poster: houseOfDragonPoster, trailerUrl: "https://www.youtube.com/watch?v=YN2H_sKcmGw", genres: ["Fantasy", "Drama", "Action"] },
    { id: "latest-6", title: "Fallout", year: 2024, poster: falloutPoster, trailerUrl: "https://www.youtube.com/watch?v=ECI3eCAxRGw", genres: ["Sci-Fi", "Action", "Adventure"] },
    { id: "trending-4", title: "The Bear", year: 2024, poster: theBearPoster, trailerUrl: "https://www.youtube.com/watch?v=vOyRo-Yjr2Q", genres: ["Drama", "Comedy"] },
    { id: "trending-5", title: "3 Body Problem", year: 2024, poster: threeBodyProblemPoster, trailerUrl: "https://www.youtube.com/watch?v=SdvzhCL7vIA", genres: ["Sci-Fi", "Drama", "Mystery"] },
    { id: "trending-6", title: "Ripley", year: 2024, poster: ripleyPoster, trailerUrl: "https://www.youtube.com/watch?v=0ri2biYLeaI", genres: ["Crime", "Thriller", "Drama"] },
  ],
};

export const trendingTrailers: Category = {
  id: "trending",
  name: "Trending Now",
  movies: [
    { id: "trending-1", title: "Baby Reindeer", year: 2024, poster: babyReindeerPoster, trailerUrl: "https://www.youtube.com/watch?v=eafm1gB6SCM", genres: ["Drama", "Thriller"] },
    { id: "trending-2", title: "The Penguin", year: 2024, poster: thePenguinPoster, trailerUrl: "https://www.youtube.com/watch?v=sfJG6IiA_s8", genres: ["Crime", "Drama"] },
    { id: "trending-3", title: "Arcane", year: 2024, poster: arcanePoster, trailerUrl: "https://www.youtube.com/watch?v=hsffPST-x1k", genres: ["Animation", "Action", "Adventure"] },
  ],
};

export const tvSeriesCategory: Category = {
  id: "tv-series",
  name: "TV Series",
  movies: [
    { id: "tv-1", title: "Stranger Things", year: 2016, poster: strangerThingsPoster, trailerUrl: "https://www.youtube.com/watch?v=b9EkMc79ZSU", genres: ["Sci-Fi", "Horror", "Drama", "TV Series"] },
    { id: "tv-2", title: "Wednesday", year: 2022, poster: wednesdayPoster, trailerUrl: "https://www.youtube.com/watch?v=Di310WS8zLk", genres: ["Comedy", "Fantasy", "Mystery", "TV Series"] },
    { id: "tv-3", title: "The White Lotus", year: 2021, poster: whiteLotusPoster, trailerUrl: "https://www.youtube.com/watch?v=TGLq7_MonZ4", genres: ["Drama", "Comedy", "TV Series"] },
    { id: "tv-4", title: "Yellowjackets", year: 2021, poster: yellowjacketsPoster, trailerUrl: "https://www.youtube.com/watch?v=Axx9Qhct49w", genres: ["Drama", "Horror", "Mystery", "TV Series"] },
    { id: "tv-5", title: "Slow Horses", year: 2022, poster: slowHorsesPoster, trailerUrl: "https://www.youtube.com/watch?v=A9BCtrziWtg", genres: ["Thriller", "Drama", "TV Series"] },
    { id: "tv-6", title: "The Gentlemen", year: 2024, poster: theGentlemenPoster, trailerUrl: "https://www.youtube.com/watch?v=wyEOwHrpZH4", genres: ["Action", "Crime", "Comedy", "TV Series"] },
    { id: "tv-7", title: "Mr. & Mrs. Smith", year: 2024, poster: mrAndMrsSmithPoster, trailerUrl: "https://www.youtube.com/watch?v=AsaMWxppznk", genres: ["Action", "Comedy", "Crime", "TV Series"] },
    { id: "tv-8", title: "Hacks", year: 2021, poster: hacksPoster, trailerUrl: "https://www.youtube.com/watch?v=q6ke-bfXSBg", genres: ["Comedy", "Drama", "TV Series"] },
    { id: "tv-9", title: "Reacher", year: 2022, poster: reacherPoster, trailerUrl: "https://www.youtube.com/watch?v=GSycMV-_Csw", genres: ["Action", "Crime", "Drama", "TV Series"] },
    { id: "tv-10", title: "True Detective: Night Country", year: 2024, poster: trueDetectiveS4Poster, trailerUrl: "https://www.youtube.com/watch?v=WkL7cpG2UhE", genres: ["Drama", "Crime", "Thriller", "TV Series"] },
    { id: "tv-11", title: "Dark Matter", year: 2024, poster: darkMatterPoster, trailerUrl: "https://www.youtube.com/watch?v=j6ucGt_Xp14", genres: ["Sci-Fi", "Thriller", "Drama", "TV Series"] },
    { id: "tv-12", title: "Pachinko", year: 2022, poster: pachinkoPoster, trailerUrl: "https://www.youtube.com/watch?v=O1r5XXJOYNA", genres: ["Drama", "History", "TV Series"] },
    { id: "tv-13", title: "The Boys", year: 2019, poster: theBoysPoster, trailerUrl: "https://www.youtube.com/watch?v=tcrNsIaQkb4", genres: ["Action", "Comedy", "Sci-Fi", "TV Series"] },
    { id: "tv-14", title: "Silo", year: 2023, poster: siloPoster, trailerUrl: "https://www.youtube.com/watch?v=8ZYhuvIv1pA", genres: ["Sci-Fi", "Drama", "Thriller", "TV Series"] },
    { id: "tv-15", title: "The Witcher", year: 2019, poster: theWitcherPoster, trailerUrl: "https://www.youtube.com/watch?v=ndl1W4ltcmg", genres: ["Fantasy", "Action", "Drama", "TV Series"] },
    { id: "tv-16", title: "Emily in Paris", year: 2020, poster: emilyInParisPoster, trailerUrl: "https://www.youtube.com/watch?v=uI54qqXt2r8", genres: ["Comedy", "Drama", "Romance", "TV Series"] },
    { id: "tv-17", title: "Percy Jackson", year: 2023, poster: percyJacksonPoster, trailerUrl: "https://www.youtube.com/watch?v=yT1ng2tiwLA", genres: ["Fantasy", "Adventure", "Family", "TV Series"] },
    { id: "tv-18", title: "Rings of Power", year: 2022, poster: ringsOfPowerPoster, trailerUrl: "https://www.youtube.com/watch?v=x8UAUAuKNcU", genres: ["Fantasy", "Action", "Adventure", "TV Series"] },
  ],
};

// Help find a movie in static data by ID or Title
export const findStaticMovie = (id: string, title?: string): Movie | null => {
  // Lazy evaluation to avoid initialization errors
  const allStaticMovies: Movie[] = [
    ...latestTrailers.movies,
    ...trendingTrailers.movies,
    ...tvSeriesCategory.movies,
    ...categories.flatMap(cat => cat.movies),
  ];

  // 1. Try exact ID match
  const byId = allStaticMovies.find(m => m.id === id);
  if (byId) return byId;

  // 2. Try matching by removing 'db-' prefix
  const byStrippedId = allStaticMovies.find(m => m.id === id.replace(/^db-/, ''));
  if (byStrippedId) return byStrippedId;

  // 3. IMPORTANT FALLBACK: Matching by Title (case insensitive)
  // This is the most reliable way when numeric IDs conflict
  if (title) {
    const normalizedTitle = title.toLowerCase().trim();
    const byTitle = allStaticMovies.find(m => m.title.toLowerCase().trim() === normalizedTitle);
    if (byTitle) return byTitle;
  }

  return null;
};

export const categories: Category[] = [
  latestTrailers,
  trendingTrailers,
  tvSeriesCategory,
  {
    id: "hollywood",
    name: "Hollywood",
    movies: [
      { id: "db-1", title: "Inception", year: 2010, poster: inceptionPoster, trailerUrl: "https://www.youtube.com/watch?v=YoHD9XEInc0", genres: ["Sci-Fi", "Action", "Thriller"] },
      { id: "db-2", title: "The Dark Knight", year: 2008, poster: darkKnightPoster, trailerUrl: "https://www.youtube.com/watch?v=EXeTwQWrcwY", genres: ["Action", "Crime", "Drama"] },
      { id: "db-3", title: "Interstellar", year: 2014, poster: interstellarPoster, trailerUrl: "https://www.youtube.com/watch?v=zSWdZVtXT7E", genres: ["Sci-Fi", "Adventure", "Drama"] },
      { id: "h-1", title: "Oppenheimer", year: 2023, poster: oppenheimerPoster, trailerUrl: "https://www.youtube.com/watch?v=bK6ldnjE3Y0", genres: ["History", "Drama", "Biography"] },
      { id: "h-2", title: "Dune: Part Two", year: 2024, poster: dunePoster, trailerUrl: "https://www.youtube.com/watch?v=Way9Dexny3w", genres: ["Sci-Fi", "Adventure", "Action"] },
      { id: "h-3", title: "Avatar: The Way of Water", year: 2022, poster: avatarPoster, trailerUrl: "https://www.youtube.com/watch?v=d9MyW72ELq0", genres: ["Sci-Fi", "Action", "Fantasty"] },
      { id: "h-4", title: "The Batman", year: 2022, poster: theBatmanPoster, trailerUrl: "https://www.youtube.com/watch?v=mqqft2x_Aa4", genres: ["Action", "Crime", "Drama"] },
      { id: "h-5", title: "Top Gun: Maverick", year: 2022, poster: topGunPoster, trailerUrl: "https://www.youtube.com/watch?v=qSqVVswa420", genres: ["Action", "Drama"] },
      { id: "h-6", title: "Black Panther: Wakanda Forever", year: 2022, poster: blackPantherPoster, trailerUrl: "https://www.youtube.com/watch?v=_Z3QKkl1WyM", genres: ["Action", "Adventure", "Sci-Fi"] },
      { id: "h-7", title: "Spider-Man: No Way Home", year: 2021, poster: spidermanPoster, trailerUrl: "https://www.youtube.com/watch?v=JfVOs4VSpmA", genres: ["Action", "Adventure", "Sci-Fi"] },
    ],
  },
  {
    id: "nollywood",
    name: "Nollywood",
    movies: [
      { id: "n-1", title: "The Black Book", year: 2023, poster: theBlackBookPoster, trailerUrl: "https://www.youtube.com/watch?v=6PPH4SOm9gk", genres: ["Thriller", "Action"] },
      { id: "n-2", title: "Anikulapo", year: 2022, poster: anikulapoPoster, trailerUrl: "https://www.youtube.com/watch?v=CBnIpwSOWEg", genres: ["Drama", "Fantasy"] },
      { id: "n-3", title: "King of Thieves", year: 2022, poster: kingOfThievesPoster, trailerUrl: "https://www.youtube.com/watch?v=7VzWqdFfdGY", genres: ["Action", "Fantasy"] },
      { id: "n-4", title: "Gangs of Lagos", year: 2023, poster: gangsOfLagosPoster, trailerUrl: "https://www.youtube.com/watch?v=CciXkcGPij8", genres: ["Action", "Crime"] },
      { id: "n-5", title: "Brotherhood", year: 2022, poster: brotherhoodPoster, trailerUrl: "https://www.youtube.com/watch?v=cJaR6ScaKmM", genres: ["Action", "Thriller"] },
      { id: "n-6", title: "Jagun Jagun", year: 2023, poster: jagunJagunPoster, trailerUrl: "https://www.youtube.com/watch?v=Ud8mbOMgu2w", genres: ["Action", "Drama", "History"] },
      { id: "n-7", title: "A Tribe Called Judah", year: 2023, poster: aTribeCalledJudahPoster, trailerUrl: "https://www.youtube.com/watch?v=pEUZVfeCU94", genres: ["Comedy", "Drama"] },
    ],
  },
  {
    id: "bollywood",
    name: "Bollywood",
    movies: [
      { id: "b-1", title: "Pathaan", year: 2023, poster: pathaanPoster, trailerUrl: "https://www.youtube.com/watch?v=vqu4z34wENw", genres: ["Action", "Thriller"] },
      { id: "b-2", title: "Jawan", year: 2023, poster: jawanPoster, trailerUrl: "https://www.youtube.com/watch?v=COv52Qyctws", genres: ["Action", "Thriller"] },
      { id: "b-3", title: "Rocky Aur Rani Ki Prem Kahani", year: 2023, poster: rockyRaniPoster, trailerUrl: "https://www.youtube.com/watch?v=6mdxy3zohEk", genres: ["Comedy", "Romance", "Drama"] },
      { id: "b-4", title: "Animal", year: 2023, poster: animalPoster, trailerUrl: "https://www.youtube.com/watch?v=sHdKw3PfFnc", genres: ["Action", "Crime", "Drama"] },
      { id: "b-5", title: "RRR", year: 2022, poster: rrrPoster, trailerUrl: "https://www.youtube.com/watch?v=NgBoMJy386M", genres: ["Action", "Drama", "History"] },
      { id: "b-6", title: "Brahmastra", year: 2022, poster: brahmastraPoster, trailerUrl: "https://www.youtube.com/watch?v=g7dTjZuwlAM", genres: ["Action", "Fantasy", "Adventure"] },
      { id: "b-7", title: "KGF Chapter 2", year: 2022, poster: kgf2Poster, trailerUrl: "https://www.youtube.com/watch?v=JKa05nyUmuQ", genres: ["Action", "Crime", "Drama"] },
    ],
  },
  {
    id: "korean",
    name: "Korean Cinema",
    movies: [
      { id: "k-1", title: "Parasite", year: 2019, poster: parasitePoster, trailerUrl: "https://www.youtube.com/watch?v=5xH0HfJHsaY", genres: ["Comedy", "Thriller", "Drama"] },
      { id: "k-2", title: "Squid Game", year: 2021, poster: squidGamePoster, trailerUrl: "https://www.youtube.com/watch?v=oqxAJKy0ii4", genres: ["Action", "Thriller"] },
      { id: "k-3", title: "Oldboy", year: 2003, poster: oldboyPoster, trailerUrl: "https://www.youtube.com/watch?2HkjrJ6IK5E", genres: ["Action", "Drama", "Mystery"] },
      { id: "k-4", title: "Train to Busan", year: 2016, poster: trainToBusanPoster, trailerUrl: "https://www.youtube.com/watch?v=pyWuHv2-Abk", genres: ["Action", "Horror", "Thriller"] },
      { id: "k-5", title: "The Handmaiden", year: 2016, poster: handmaidenPoster, trailerUrl: "https://www.youtube.com/watch?v=whldChqCsYk", genres: ["Thriller", "Drama", "Romance"] },
      { id: "k-6", title: "Memories of Murder", year: 2003, poster: memoriesOfMurderPoster, trailerUrl: "https://www.youtube.com/watch?v=0n_HQwQU8ls", genres: ["Crime", "Drama", "Thriller"] },
    ],
  },
  {
    id: "animation",
    name: "Animation",
    movies: [
      { id: "a-1", title: "Suzume", year: 2022, poster: suzumePoster, trailerUrl: "https://www.youtube.com/watch?v=5pTcio2hTSw", genres: ["Animation", "Adventure", "Fantasy"] },
      { id: "a-2", title: "Jujutsu Kaisen 0", year: 2021, poster: jujutsuKaisenPoster, trailerUrl: "https://www.youtube.com/watch?v=4A_X-Dvl0ws", genres: ["Animation", "Action", "Fantasy"] },
      { id: "a-3", title: "Your Name", year: 2016, poster: yourNamePoster, trailerUrl: "https://www.youtube.com/watch?v=xU47nhruN-Q", genres: ["Animation", "Drama", "Fantasy"] },
      { id: "a-4", title: "Spirited Away", year: 2001, poster: spiritedAwayPoster, trailerUrl: "https://www.youtube.com/watch?v=ByXuk9QqQkk", genres: ["Animation", "Adventure", "Family"] },
      { id: "a-5", title: "Demon Slayer: Mugen Train", year: 2020, poster: demonSlayerPoster, trailerUrl: "https://www.youtube.com/watch?v=ATJYac_dORw", genres: ["Animation", "Action", "Fantasy"] },
      { id: "a-6", title: "Weathering with You", year: 2019, poster: weatheringPoster, trailerUrl: "https://www.youtube.com/watch?v=Q6iK6DjV_iE", genres: ["Animation", "Drama", "Fantasy"] },
    ],
  },
  {
    id: "chinese",
    name: "Chinese Cinema",
    movies: [
      { id: "c-1", title: "The Wandering Earth 2", year: 2023, poster: wanderingEarthPoster, trailerUrl: "https://www.youtube.com/watch?v=8ZIfInUTiIg", genres: ["Sci-Fi", "Action", "Adventure"] },
      { id: "c-2", title: "Detective Chinatown 3", year: 2021, poster: detectiveChinatown3Poster, trailerUrl: "https://www.youtube.com/watch?v=Q3yHJuRkfUI", genres: ["Comedy", "Action", "Mystery"] },
      { id: "c-3", title: "Hi, Mom", year: 2021, poster: hiMomPoster, trailerUrl: "https://www.youtube.com/watch?v=GjrtxkuFBtk", genres: ["Comedy", "Drama", "Fantasy"] },
      { id: "c-4", title: "The Battle at Lake Changjin", year: 2021, poster: battleLakePoster, trailerUrl: "https://www.youtube.com/watch?v=7MlTVsKHoC0", genres: ["War", "Action", "Drama"] },
      { id: "c-5", title: "Ne Zha", year: 2019, poster: neZhaPoster, trailerUrl: "https://www.youtube.com/watch?v=0S7_LgTiHnA", genres: ["Animation", "Action", "Fantasy"] },
    ],
  },
  {
    id: "european",
    name: "European Cinema",
    movies: [
      { id: "e-1", title: "The Zone of Interest", year: 2023, poster: zoneOfInterestPoster, trailerUrl: "https://www.youtube.com/watch?v=r-vfg3KkV54", genres: ["Drama", "History", "War"] },
      { id: "e-2", title: "Anatomy of a Fall", year: 2023, poster: anatomyOfFallPoster, trailerUrl: "https://www.youtube.com/watch?v=fTrsp5BMloA", genres: ["Drama", "Thriller", "Crime"] },
      { id: "e-3", title: "Amélie", year: 2001, poster: ameliePoster, trailerUrl: "https://www.youtube.com/watch?v=HUECWi5pX7o", genres: ["Romance", "Comedy"] },
      { id: "e-4", title: "The Intouchables", year: 2011, poster: intouchablesPoster, trailerUrl: "https://www.youtube.com/watch?v=34WIbmXkewU", genres: ["Biography", "Comedy", "Drama"] },
      { id: "e-5", title: "Pan's Labyrinth", year: 2006, poster: pansLabyrinthPoster, trailerUrl: "https://www.youtube.com/watch?v=EqYiSlkvRuw", genres: ["Drama", "Fantasy", "War"] },
    ],
  },
  {
    id: "thrillers",
    name: "Thrillers",
    movies: [
      { id: "t-1", title: "Se7en", year: 1995, poster: se7enPoster, trailerUrl: "https://www.youtube.com/watch?v=znmZoVkCjpI", genres: ["Crime", "Drama", "Mystery"] },
      { id: "t-2", title: "Gone Girl", year: 2014, poster: goneGirlPoster, trailerUrl: "https://www.youtube.com/watch?v=2-_-1nJf8Vg", genres: ["Drama", "Mystery", "Thriller"] },
      { id: "t-3", title: "Prisoners", year: 2013, poster: prisonersPoster, trailerUrl: "https://www.youtube.com/watch?v=bpXfcTF6iVk", genres: ["Crime", "Drama", "Mystery"] },
      { id: "t-4", title: "Shutter Island", year: 2010, poster: shutterIslandPoster, trailerUrl: "https://www.youtube.com/watch?v=5iaYLCiq5RM", genres: ["Mystery", "Thriller"] },
      { id: "t-5", title: "The Silence of the Lambs", year: 1991, poster: silenceOfLambsPoster, trailerUrl: "https://www.youtube.com/watch?v=6iB21hsprAQ", genres: ["Crime", "Drama", "Thriller"] },
      { id: "t-6", title: "Zodiac", year: 2007, poster: zodiacPoster, trailerUrl: "https://www.youtube.com/watch?v=yNncHPl1UXg", genres: ["Crime", "Drama", "Mystery"] },
      { id: "t-7", title: "No Country for Old Men", year: 2007, poster: noCountryPoster, trailerUrl: "https://www.youtube.com/watch?v=38A__WT3-o0", genres: ["Crime", "Drama", "Thriller"] },
    ],
  },
];
