import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";

const CONTACT_EMAIL = "goodborbor@gmail.com";
const LAST_UPDATED = "June 24, 2026";

const PrivacyPolicy = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="relative min-h-screen bg-background">
      <SEOHead
        title="Privacy Policy - TrailersHub"
        description="How TrailersHub collects, uses, and protects your personal information."
      />

      <div className="edge-glow" aria-hidden="true" />
      <div className="edge-glow-extra" aria-hidden="true" />

      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery("")}
      />

      <main className="pt-24 pb-16">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto">
          <h1 className="font-display text-3xl md:text-4xl tracking-wide mb-2">
            Privacy <span className="text-primary">Policy</span>
          </h1>
          <p className="text-sm text-muted-foreground mb-10">
            Last updated: {LAST_UPDATED}
          </p>

          <div className="space-y-8 text-muted-foreground leading-relaxed">
            <section>
              <p>
                This Privacy Policy explains how TrailersHub ("we", "us", or "our")
                collects, uses, and protects your information when you visit and use
                our website. By using TrailersHub, you agree to the practices
                described below.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                1. Information We Collect
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="text-foreground">Account information.</strong> When
                  you create an account, we collect your email address and the
                  credentials you provide.
                </li>
                <li>
                  <strong className="text-foreground">Newsletter sign-ups.</strong> If
                  you subscribe to our newsletter, we store your email address to send
                  you updates.
                </li>
                <li>
                  <strong className="text-foreground">Comments and reviews.</strong> Any
                  comments, reviews, or ratings you submit are stored and associated
                  with your account.
                </li>
                <li>
                  <strong className="text-foreground">Usage and device data.</strong> We
                  automatically collect limited technical information such as your IP
                  address, browser type, pages visited, and login history to operate
                  and secure the site.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                2. How We Use Your Information
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>To provide, maintain, and improve the website and its features.</li>
                <li>To manage your account and authenticate you when you log in.</li>
                <li>To send newsletters and updates you have subscribed to.</li>
                <li>To display your comments and reviews to other users.</li>
                <li>To monitor for security, prevent abuse, and analyze site usage.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                3. Cookies and Similar Technologies
              </h2>
              <p>
                We use cookies and similar technologies to keep you signed in,
                remember your preferences, and understand how the site is used. You
                can control or disable cookies through your browser settings, though
                some features may not work properly without them.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                4. Third-Party Services
              </h2>
              <p>
                TrailersHub displays trailers and related movie data sourced from
                third-party providers (such as TMDB and embedded video platforms).
                When you view this content, those providers may collect information
                according to their own privacy policies. We do not control and are not
                responsible for the privacy practices of third-party services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                5. How We Protect Your Information
              </h2>
              <p>
                We take reasonable technical and organizational measures to protect
                your information against unauthorized access, loss, or misuse. However,
                no method of transmission or storage is completely secure, and we
                cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                6. Your Rights and Choices
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You may access or update your account information at any time.</li>
                <li>
                  You can unsubscribe from our newsletter using the link in any email
                  we send.
                </li>
                <li>
                  You may request that we delete your account and associated personal
                  data by contacting us.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                7. Children's Privacy
              </h2>
              <p>
                TrailersHub is not intended for children under the age of 13. We do not
                knowingly collect personal information from children. If you believe a
                child has provided us with personal data, please contact us so we can
                remove it.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                8. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. When we do, we
                will revise the "Last updated" date at the top of this page. We
                encourage you to review this page periodically.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                9. Contact Us
              </h2>
              <p>
                If you have any questions about this Privacy Policy or how your data is
                handled, please contact us at{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-primary hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
