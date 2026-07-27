import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  BatteryCharging, BookOpen, Boxes, ChevronDown, Crosshair, Flag,
  Gauge, Layers3, Mail, Menu, Shield, Skull, Smartphone, Sparkles,
  Target, Trophy, UserRoundCheck, UsersRound, Zap,
} from "lucide-react";
import "./dead-city.css";

const DESCRIPTION = "Explore Dead City: Apocalypse, learn the basics, master advanced zombie-survival tactics, manage heroes and graphics settings, and access official support and legal information.";

const features = [
  [Skull, "Survive the waves", "Fight through escalating zombie waves and eliminate every remaining threat to advance."],
  [UsersRound, "Build your squad", "Unlock and strengthen heroes with different combat strengths, movement characteristics, and progression paths."],
  [Shield, "Master your defences", "Time shields and abilities carefully to protect the commander and supporting hero during close-range attacks."],
  [Crosshair, "Face deadlier enemies", "Encounter regular zombies, stronger Vanguard variants, elite threats, and bosses as the difficulty rises."],
  [Sparkles, "Upgrade and progress", "Improve heroes, equipment, inventory, blueprints, and mission performance."],
  [Trophy, "Climb the leaderboards", "Choose a public username and country flag, then compete for highest-level and total-kill rankings."],
] as const;

const basicTraining = [
  "Create or continue your player profile.",
  "Google sign-in is optional but allows supported progress and account features to remain linked to the player.",
  "Open the Heroes area and review your available commander and supporting heroes.",
  "Prepare your loadout from the Heroes and Inventory sections.",
  "Select Fight, choose an available level and difficulty tier, and begin the mission.",
  "Move horizontally to maintain a safe firing position and keep enemies inside the combat lane.",
  "Watch the wave counter and eliminate all active enemies before the next wave can begin.",
  "Activate the shield at the correct moment when zombies reach close range.",
  "Use combat abilities strategically instead of wasting them on weak threats.",
  "Complete the level, collect rewards, and use them to improve the squad.",
];

const tactics = [
  [Target, "Positioning", "Stay within the visible combat area, avoid being trapped at an edge, and keep enemies aligned with the firing lane."],
  [Shield, "Shield timing", "Do not activate the shield too early. Save it for dangerous close-range pressure, Vanguard enemies, elites, or moments when both heroes are threatened."],
  [Crosshair, "Target priority", "Prioritize fast enemies, Vanguard enemies, elites, and bosses before slower regular zombies overwhelm the formation."],
  [Zap, "Ability management", "Use Rage, Sync, and other available abilities when their effect will meaningfully change the fight. Avoid wasting powerful abilities near the end of an already-controlled wave."],
  [UsersRound, "Support-hero safety", "Monitor both the commander and supporting hero. A shielded commander should not cause nearby zombies to unfairly overwhelm the supporting hero."],
] as const;

const enemies = [
  ["01", "Regular zombies", "The standard threat. Individually manageable but dangerous in groups."],
  ["02", "Vanguard zombies", "Stronger defensive enemies designed to survive longer and pressure the player at close range."],
  ["03", "Elite threats", "Enhanced enemies that require stronger targeting and ability management."],
  ["04", "Bosses", "Major encounters with substantially greater durability and threat."],
];

const graphics = [
  ["Very Low", "Designed for weaker or older devices."],
  ["Low", "Prioritizes performance while preserving essential visuals."],
  ["Medium", "Balanced visuals and performance."],
  ["High", "Enhanced visual quality for capable devices."],
  ["Max", "Maximum supported visual quality for high-specification devices."],
];

const troubleshooting = [
  ["Google sign-in fails", ["Confirm the device has an internet connection.", "Update Google Play services and the Play Store.", "Confirm the correct Google account is available on the device.", "Restart the game and retry.", "Contact support if the problem continues."]],
  ["Progress does not appear", ["Confirm the same Google account is being used.", "Allow cloud synchronization to complete.", "Avoid rapidly switching accounts.", "Contact support before deleting local game data."]],
  ["Performance or stuttering", ["Select a lower graphics preset.", "Close background apps.", "Restart the device.", "Ensure sufficient free storage.", "Avoid Max graphics on devices that cannot sustain it."]],
  ["Characters or previews render incorrectly", ["Return to the menu and reopen the preview.", "Restart the game after changing graphics presets.", "Report persistent rendering problems with the device model and selected graphics tier."]],
  ["Account deletion email does not arrive", ["Confirm the signed-in email account is correct.", "Check spam or junk folders.", "Wait briefly before requesting another code.", "Do not repeatedly request codes because security rate limits may apply."]],
] as const;

const SectionTitle = ({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) => (
  <div className="dc-section-title">
    <span>{eyebrow}</span>
    <h2>{children}</h2>
  </div>
);

const DeadCityHub = () => (
  <div className="dc-page">
    <Helmet>
      <title>Dead City: Apocalypse — Official Game Guide</title>
      <meta name="description" content={DESCRIPTION} />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
      <link rel="canonical" href="https://trailershub.org/dead-city/" />
      <meta property="og:title" content="Dead City: Apocalypse — Official Game Guide" />
      <meta property="og:description" content={DESCRIPTION} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://trailershub.org/dead-city/" />
    </Helmet>

    <a className="dc-skip" href="#main-content">Skip to game guide</a>
    <header className="dc-header">
      <a className="dc-brand" href="#top" aria-label="Dead City: Apocalypse home">
        <span className="dc-brand-mark" aria-hidden="true"><Skull /></span>
        <span><b>Dead City</b><small>Apocalypse</small></span>
      </a>
      <nav aria-label="Game guide navigation">
        <a href="#overview">Overview</a>
        <a href="#basic-training">How to Play</a>
        <a href="#advanced-guide">Guides</a>
        <a href="#support">Support</a>
      </nav>
      <span className="dc-mobile-menu" aria-hidden="true"><Menu /></span>
    </header>

    <main id="main-content">
      <section className="dc-hero" id="top">
        <div className="dc-atmosphere" aria-hidden="true"><span /><span /><span /></div>
        <div className="dc-hero-copy">
          <p className="dc-kicker"><span /> Official game guide</p>
          <h1>Dead City:<br /><em>Apocalypse</em></h1>
          <p className="dc-tagline">Hold the line. Build your squad. Survive the city.</p>
          <p className="dc-lede">Lead your commander and supporting hero through increasingly dangerous zombie waves. Strengthen your squad, master defensive abilities, unlock powerful heroes, and survive escalating difficulty tiers.</p>
          <div className="dc-actions">
            <a className="dc-button dc-button-primary" href="#basic-training"><BookOpen /> How to Play</a>
            <a className="dc-button dc-button-secondary" href="#advanced-guide"><Crosshair /> Game Guides</a>
          </div>
          <div className="dc-play-status" aria-label="Google Play availability">
            <Smartphone aria-hidden="true" />
            <span><small>Android release</small><strong>Coming soon on Google Play</strong></span>
          </div>
        </div>
        <div className="dc-hero-panel" aria-label="Game combat overview">
          <div className="dc-radar" aria-hidden="true"><span /><span /><span /><Skull /></div>
          <p>Survival protocol</p>
          <dl>
            <div><dt>Formation</dt><dd>Commander + Support</dd></div>
            <div><dt>Mission type</dt><dd>Multi-wave survival</dd></div>
            <div><dt>Orientation</dt><dd>Portrait</dd></div>
            <div><dt>Threat level</dt><dd className="danger">Escalating</dd></div>
          </dl>
        </div>
      </section>

      <section className="dc-section dc-overview" id="overview">
        <SectionTitle eyebrow="Situation report">Survive. Adapt. Advance.</SectionTitle>
        <div className="dc-overview-grid">
          <p className="dc-intro">Dead City: Apocalypse is a portrait-oriented zombie survival action shooter built around tactical movement, squad development, and surviving every threat in each increasingly dangerous wave.</p>
          <ul className="dc-check-grid">
            {["Multi-wave missions", "Commander and supporting-hero combat", "Tactical horizontal movement", "Shields and combat abilities", "Hero collection and progression", "Equipment, inventory, and blueprints", "Missions and daily rewards", "Public usernames, flags, rankings, and leaderboards", "Normal, Hard, Ultimate, and Nightmare tiers"].map(item => <li key={item}><span aria-hidden="true">+</span>{item}</li>)}
          </ul>
        </div>
        <p className="dc-note"><Flag /> Leaderboards record competitive achievements such as highest level and total kills. Dead City does not claim direct player-versus-player combat.</p>
      </section>

      <section className="dc-section dc-darker">
        <SectionTitle eyebrow="Core systems">Built for survival</SectionTitle>
        <div className="dc-feature-grid">
          {features.map(([Icon, title, text], index) => <article className="dc-feature" key={title}><span className="dc-card-number">0{index + 1}</span><Icon /><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </section>

      <section className="dc-section" id="basic-training">
        <SectionTitle eyebrow="Field manual 01">How to Play — Basic Training</SectionTitle>
        <p className="dc-section-lede">Your first deployment, from profile setup to mission rewards.</p>
        <ol className="dc-training">
          {basicTraining.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, "0")}</span><p>{step}</p></li>)}
        </ol>
      </section>

      <section className="dc-section dc-darker" id="advanced-guide">
        <SectionTitle eyebrow="Field manual 02">Advanced Survival Tactics</SectionTitle>
        <div className="dc-tactics">
          {tactics.map(([Icon, title, text]) => <article key={title}><Icon /><div><h3>{title}</h3><p>{text}</p></div></article>)}
        </div>
        <div className="dc-tiers">
          <h3>Difficulty tiers</h3>
          <div>{[["Normal", "Introductory combat and progression."], ["Hard", "Stronger enemies and tighter survival pressure."], ["Ultimate", "Advanced encounters requiring stronger builds."], ["Nightmare", "The highest sustained combat challenge."]].map(([name, text], index) => <article key={name} data-level={index}><span>{index + 1}</span><h4>{name}</h4><p>{text}</p></article>)}</div>
        </div>
      </section>

      <section className="dc-section">
        <SectionTitle eyebrow="Threat database">Enemy Field Guide</SectionTitle>
        <div className="dc-enemy-grid">{enemies.map(([code, name, text]) => <article key={name}><span>{code}</span><Skull /><h3>{name}</h3><p>{text}</p></article>)}</div>
        <p className="dc-note dc-note-danger"><Crosshair /> Every enemy in an active wave must be resolved before progression continues.</p>
      </section>

      <section className="dc-section dc-split dc-darker">
        <div>
          <SectionTitle eyebrow="Squad development">Heroes and Progression</SectionTitle>
          <p className="dc-intro">Heroes can have different roles and combat strengths. Inspect their capabilities before committing resources to an unlock or upgrade.</p>
          <ul className="dc-line-list"><li>Blueprints and cosmetic variants may be available for supported heroes.</li><li>Inventory and currencies support progression.</li><li>Higher difficulty tiers require thoughtful hero and equipment development.</li></ul>
          <p className="dc-smallprint">Availability can vary. A displayed hero, cosmetic, purchase, or feature is not necessarily immediately available.</p>
        </div>
        <div className="dc-system-card" aria-hidden="true"><UsersRound /><span>Squad systems</span><div><b>Commander</b><i>Primary combat role</i></div><div><b>Support hero</b><i>Formation partner</i></div><div><b>Loadout</b><i>Equipment + inventory</i></div></div>
      </section>

      <section className="dc-section">
        <SectionTitle eyebrow="Device readiness">Graphics and Performance Guide</SectionTitle>
        <div className="dc-graphics-grid">{graphics.map(([name, text], index) => <article key={name}><Gauge /><div><span>{index + 1}/5</span><h3>{name}</h3><p>{text}</p></div></article>)}</div>
        <div className="dc-advice"><BatteryCharging /><div><h3>Performance checklist</h3><ul><li>Lower the graphics setting if gameplay stutters or the device becomes hot.</li><li>Close unnecessary background applications.</li><li>Keep Android and Google Play services updated.</li><li>Restart the game after major graphics changes if rendering appears incorrect.</li><li>Max graphics is intended for capable devices and may increase heat and battery use.</li></ul><p>Performance varies by device; no specific frame rate is guaranteed.</p></div></div>
      </section>

      <section className="dc-section dc-darker dc-split">
        <div>
          <SectionTitle eyebrow="Player identity">Account, Cloud and Leaderboards</SectionTitle>
          <ul className="dc-line-list"><li>Continue as a local/guest-style player or use supported Google sign-in.</li><li>A signed-in account can use supported cloud-linked features.</li><li>Your public username is what other leaderboard players see.</li><li>A selected country flag can appear with your leaderboard identity.</li><li>Use the same Google account when restoring a linked player profile.</li></ul>
        </div>
        <div className="dc-privacy-card"><UserRoundCheck /><h3>Public identity, protected account</h3><p>Email addresses and internal Unity player IDs must never appear on public leaderboards.</p></div>
      </section>

      <section className="dc-section">
        <div className="dc-deletion-panel">
          <div><span className="dc-kicker"><span /> Account control</span><h2>Permanent Account Deletion</h2><p>Signed-in players can permanently delete their Dead City account from the game’s Account section. The process requires explicit confirmation and email verification. Successful deletion removes the Dead City player account, cloud progress, inventory, currencies, account profile, and leaderboard data. It does not delete the player’s Google account.</p></div>
          <Link className="dc-button dc-button-danger" to="/dead-city/privacy-policy#account-deletion">Account Deletion Information</Link>
        </div>
      </section>

      <section className="dc-section dc-darker">
        <SectionTitle eyebrow="Technical support">Troubleshooting</SectionTitle>
        <div className="dc-accordion">{troubleshooting.map(([title, items], index) => <details key={title} open={index === 0}><summary><span>{title}</span><ChevronDown /></summary><ul>{items.map(item => <li key={item}>{item}</li>)}</ul></details>)}</div>
      </section>

      <section className="dc-section dc-support" id="support">
        <SectionTitle eyebrow="Need assistance?">Support and Legal</SectionTitle>
        <div className="dc-support-grid">
          <div><span>Developer</span><strong>Peter Rock / RockTimeMedia</strong></div>
          <a href="mailto:rocktimemedia@gmail.com"><Mail /><span>Support</span><strong>rocktimemedia@gmail.com</strong></a>
        </div>
        <nav aria-label="Dead City legal links"><Link to="/dead-city/privacy-policy">Privacy Policy</Link><Link to="/dead-city/terms-and-conditions">Terms and Conditions</Link><Link to="/dead-city/privacy-policy#account-deletion">Account Deletion</Link></nav>
      </section>
    </main>

    <footer className="dc-footer"><div className="dc-brand"><span className="dc-brand-mark"><Skull /></span><span><b>Dead City</b><small>Apocalypse</small></span></div><p>Dead City: Apocalypse is an external game project by Peter Rock / RockTimeMedia. This page is hosted using TrailerHub infrastructure. Dead City accounts and game data are separate from TrailerHub’s movie-trailer accounts and content.</p></footer>
  </div>
);

export default DeadCityHub;
