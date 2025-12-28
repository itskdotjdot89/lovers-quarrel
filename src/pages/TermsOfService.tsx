import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-foreground hover:text-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display text-3xl ml-4 text-foreground">
            Terms of Service
          </h1>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="bg-card border-2 border-border rounded-lg p-6 space-y-6 font-ui text-sm text-muted-foreground">
            <p className="text-xs text-muted-foreground">
              Last updated: December 2024
            </p>

            <section>
              <h2 className="font-display text-lg text-foreground mb-3">Acceptance of Terms</h2>
              <p>
                By downloading, accessing, or using Lovers' Quarrel, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our app.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg text-foreground mb-3">Eligibility</h2>
              <p>
                Lovers' Quarrel is intended for adults aged 18 and older. By using this app, you confirm that you are at least 18 years of age. We reserve the right to terminate accounts of users who do not meet this requirement.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg text-foreground mb-3">Description of Service</h2>
              <p>
                Lovers' Quarrel is an intimate conversation card game designed for couples and partners. The app provides prompts and questions to facilitate meaningful discussions. Some content may be of an adult nature appropriate for consenting adults.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg text-foreground mb-3">User Accounts</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You are responsible for all activities that occur under your account</li>
                <li>You must provide accurate and complete information when creating an account</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg text-foreground mb-3">Subscriptions & Payments</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Premium features require an active subscription</li>
                <li>Subscriptions automatically renew unless cancelled before the renewal date</li>
                <li>You can manage or cancel your subscription through your account settings</li>
                <li>Refunds are handled according to the App Store's refund policy</li>
                <li>Prices may change with notice; existing subscriptions honor the original price until renewal</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg text-foreground mb-3">Acceptable Use</h2>
              <p className="mb-2">You agree not to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Use the app for any unlawful purpose</li>
                <li>Share content from the app without permission</li>
                <li>Attempt to access, tamper with, or use non-public areas of the app</li>
                <li>Interfere with the proper functioning of the app</li>
                <li>Use the app to harass, abuse, or harm others</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg text-foreground mb-3">Content & Consent</h2>
              <p>
                Lovers' Quarrel is designed to be played with a consenting partner. All participants should feel comfortable and safe. We encourage users to establish boundaries and respect each other's limits. You should never pressure anyone to answer questions they're uncomfortable with.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg text-foreground mb-3">Intellectual Property</h2>
              <p>
                All content, features, and functionality of Lovers' Quarrel, including but not limited to card prompts, design, graphics, and software, are owned by us and protected by copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg text-foreground mb-3">Disclaimer of Warranties</h2>
              <p>
                Lovers' Quarrel is provided "as is" without warranties of any kind. We do not guarantee that the app will be uninterrupted, error-free, or secure. We are not responsible for any relationship outcomes resulting from use of this app.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg text-foreground mb-3">Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the app.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg text-foreground mb-3">Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account at any time for violation of these terms. You may delete your account at any time through the app settings.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg text-foreground mb-3">Changes to Terms</h2>
              <p>
                We may update these terms from time to time. Continued use of the app after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg text-foreground mb-3">Contact</h2>
              <p>
                For questions about these Terms of Service, contact us at:
              </p>
              <p className="text-secondary mt-2">
                <a href="mailto:support@loversquarrel.com">support@loversquarrel.com</a>
              </p>
            </section>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center pt-6">
          <Button
            onClick={() => navigate('/settings')}
            variant="outline"
            className="border-secondary text-secondary hover:bg-secondary hover:text-foreground"
          >
            Back to Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;