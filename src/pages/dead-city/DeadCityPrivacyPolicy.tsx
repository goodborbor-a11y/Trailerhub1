import DeadCityLegalLayout from "./DeadCityLegalLayout";

const EMAIL = "rocktimemedia@gmail.com";

const DeadCityPrivacyPolicy = () => (
  <DeadCityLegalLayout title="Privacy Policy" description="Privacy Policy for the Android game Dead City: Apocalypse." currentPage="privacy">
    <section><p>This Privacy Policy explains how Peter Rock (the “Developer,” “we,” “us,” or “our”) collects, uses, and handles information when you play the Android game <strong>Dead City: Apocalypse</strong> (the “Game”). It applies only to the Game and not to the movie-trailer website hosting this page. For privacy questions, contact <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.</p></section>
    <section>
      <h2>Information We Collect</h2>
      <p className="mt-3">We may collect and process the following information only to operate and improve the Game:</p>
      <ul className="mt-3">
        <li><strong>Google Sign-In data, if you choose to sign in:</strong> your Google account identifier, email address, authentication token or other sign-in information necessary to authenticate you, and account-linking status.</li>
        <li><strong>Game and cloud-save data:</strong> game progress; unlocked levels, heroes, weapons, upgrades, achievements, missions, and leaderboard-related information; in-game currency balances; player settings and game preferences; and cloud-save data linked to your player account.</li>
        <li><strong>Technical and gameplay analytics:</strong> gameplay events such as level starts, level completions, deaths, waves, and performance-related events, plus device and app information necessary for analytics, diagnostics, security, and service operation.</li>
      </ul>
      <p className="mt-3">The Game does not collect precise location, contacts, messages, microphone recordings, camera data, photos, payment-card details, or health data.</p>
    </section>
    <section>
      <h2>How We Use Information</h2>
      <p className="mt-3">We use the information described above to:</p>
      <ul className="mt-3"><li>authenticate players who choose Google Sign-In;</li><li>restore cloud saves and game progress across supported devices;</li><li>provide leaderboards and other Game functionality;</li><li>analyze gameplay and technical performance; and</li><li>troubleshoot bugs, prevent abuse, improve balancing, and provide player support.</li></ul>
    </section>
    <section><h2>Services We Use</h2><p className="mt-3">The Game uses Google Sign-In / Google Play services where enabled by the player, as well as Unity Authentication, Unity Cloud Save, Unity Analytics, and Unity Leaderboards. These providers may process information according to their own privacy policies while providing their services.</p></section>
    <section><h2>How We Share Information</h2><p className="mt-3">Peter Rock does not sell player personal data. Data may be processed by Google and the Unity services identified above only as needed to operate the Game. Information may also be disclosed when required by law, when reasonably necessary to protect players or the Game and its services, or as part of a lawful merger, acquisition, financing, reorganization, or other business transfer.</p></section>
    <section><h2>Security</h2><p className="mt-3">We use reasonable administrative and technical safeguards designed to protect information against unauthorized access, loss, misuse, or alteration. However, no online service or electronic storage system can guarantee absolute security.</p></section>
    <section><h2>Retention</h2><p className="mt-3">Game and account data is kept only as long as reasonably needed to run the Game, maintain cloud saves, provide support, resolve disputes, meet legal obligations, and protect against fraud or abuse.</p></section>
    <section id="account-deletion" className="scroll-mt-6 rounded-lg border border-primary/40 bg-primary/5 p-5">
      <h2>Account and Data Deletion</h2>
      <p className="mt-3">You may request deletion of your Dead City: Apocalypse account-related cloud data by emailing <a href={`mailto:${EMAIL}?subject=Dead%20City%20Account%20Deletion`}>{EMAIL}</a> with the subject “<strong>Dead City Account Deletion</strong>.” Your request should identify the Google account email used in the Game, where applicable. We may ask you to verify ownership of the linked account before deletion.</p>
      <p className="mt-3">Once the request is verified, account-linked cloud-save data, progression, and account-link records will be deleted, except information that must be retained temporarily for legal, security, fraud-prevention, or dispute-resolution reasons. Requests will be handled within 30 days.</p>
    </section>
    <section><h2>Children’s Privacy</h2><p className="mt-3">We do not knowingly collect personal data from children where consent is legally required. If you believe a child provided personal data without the legally required consent, please contact us so we can review and address the matter.</p></section>
    <section><h2>International Processing</h2><p className="mt-3">The service providers identified above may process information in countries where they operate. Those countries may have data-protection laws different from those where you live.</p></section>
    <section><h2>Changes to This Policy</h2><p className="mt-3">We may update this Privacy Policy as the Game or applicable requirements change. Updates will be posted on this page, and the “Last updated” date will be revised.</p></section>
    <section><h2>Contact Us</h2><p className="mt-3">For questions, privacy inquiries, or deletion requests, contact Peter Rock at <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.</p></section>
  </DeadCityLegalLayout>
);

export default DeadCityPrivacyPolicy;
