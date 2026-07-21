import { Link } from "react-router-dom";
import DeadCityLegalLayout from "./DeadCityLegalLayout";

const EMAIL = "rocktimemedia@gmail.com";

const DeadCityTerms = () => (
  <DeadCityLegalLayout title="Terms and Conditions" description="Terms and Conditions for the Android game Dead City: Apocalypse." currentPage="terms">
    <section><p>These Terms and Conditions (“Terms”) govern your use of the Android game <strong>Dead City: Apocalypse</strong> (the “Game”), provided by Peter Rock. Support is available at <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.</p></section>
    <section><h2>1. Acceptance of Terms</h2><p className="mt-3">By downloading, accessing, or using the Game, you agree to these Terms and the <Link to="/dead-city/privacy-policy">Privacy Policy</Link>. If you do not agree, do not use the Game.</p></section>
    <section><h2>2. License to Use the Game</h2><p className="mt-3">Subject to these Terms, Peter Rock grants you a limited, personal, non-exclusive, non-transferable, revocable license to use the Game for your personal, non-commercial entertainment. No ownership rights are transferred to you.</p></section>
    <section><h2>3. Accounts and Sign-In</h2><p className="mt-3">Google Sign-In is optional where available. You are responsible for controlling access to your account and device and for activity occurring through them. You must not sell, share, transfer, or otherwise exploit an account. Cloud-save and online services may occasionally be unavailable and are not guaranteed to work on every device or network.</p></section>
    <section><h2>4. Virtual Currency and Virtual Items</h2><p className="mt-3">Coins, diamonds, heroes, weapons, upgrades, achievements, progression, and all other virtual items have no real-world monetary value. They cannot be sold, exchanged, transferred, redeemed, or converted into real money. The Developer may reasonably rebalance Game difficulty, rewards, item values, virtual currency, or gameplay systems to maintain and improve the Game.</p></section>
    <section>
      <h2>5. Fair Play and Prohibited Conduct</h2><p className="mt-3">You must not:</p>
      <ul className="mt-3"><li>cheat or use modified APKs;</li><li>use bots, automation, hacks, exploits, or unauthorized software;</li><li>reverse engineer or interfere with the Game or its services, except where applicable law expressly permits it;</li><li>manipulate leaderboards;</li><li>attempt fraud, abuse, or unfair advantages; or</li><li>harass others where social features are available.</li></ul>
      <p className="mt-3">Access may be restricted or suspended for violations of these Terms where permitted by law.</p>
    </section>
    <section><h2>6. Intellectual Property</h2><p className="mt-3">Dead City: Apocalypse, including its code, game design, artwork, characters, music, logos, and other content, belongs to Peter Rock or the applicable licensors. You may not copy, distribute, sell, publicly exploit, or commercially use that content without prior written permission, except where applicable law expressly permits otherwise.</p></section>
    <section><h2>7. Third-Party Services</h2><p className="mt-3">The Game may use Google and Unity services for sign-in, cloud saves, analytics, authentication, and leaderboards. Those services may be governed by their own terms and privacy policies, which you should review when using them.</p></section>
    <section><h2>8. Updates and Availability</h2><p className="mt-3">The Game may be changed, updated, maintained, suspended, or discontinued. Online features may be temporarily unavailable because of maintenance, technical issues, or circumstances outside the Developer’s reasonable control. To the maximum extent allowed by applicable law, the Game is provided “as available.”</p></section>
    <section><h2>9. Disclaimers and Limitation of Liability</h2><p className="mt-3">We aim to operate the Game with reasonable care but cannot promise uninterrupted, error-free, or universally compatible service. To the extent permitted by applicable law, Peter Rock is not liable for indirect or consequential loss that was not reasonably foreseeable, or for loss caused by events beyond reasonable control. You remain responsible for using the Game appropriately and maintaining reasonable device and account security. Nothing in these Terms excludes or limits any warranty, right, remedy, or liability that applicable law does not allow to be excluded or limited.</p></section>
    <section><h2>10. Governing Law</h2><p className="mt-3">These Terms are governed by the laws of the Federal Republic of Nigeria, without regard to conflict-of-law principles.</p></section>
    <section><h2>11. Changes and Contact</h2><p className="mt-3">We may update these Terms as the Game or applicable requirements change. Updated Terms will be posted on this page with a revised “Last updated” date. Direct support questions to Peter Rock at <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.</p></section>
  </DeadCityLegalLayout>
);

export default DeadCityTerms;
