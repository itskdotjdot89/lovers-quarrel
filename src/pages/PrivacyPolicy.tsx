import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
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
            Privacy Policy
          </h1>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="bg-card border-2 border-border rounded-lg p-6 space-y-6 font-ui text-sm text-muted-foreground">
            <p className="text-xs text-muted-foreground">
              Last updated: December 2024
            </p>

            <section>
              <h2 className="font-display text-lg text-foreground mb-3">Introduction</h2>
              <p>
                Lovers' Quarrel ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our mobile application.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg text-foreground mb-3">Information We Collect</h2>
              <p className="mb-2">We may collect the following types of information:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Account Information:</strong> Email address and display name when you create an account</li>
                <li><strong>Usage Data:</strong> Game preferences, favorites, and session history</li>
                <li><strong>Response Data:</strong> Your answers to card prompts (stored securely and privately)</li>
                <li><strong>Device Information:</strong> Device type, operating system, and app version for troubleshooting</li>
                <li><strong>Payment Information:</strong> Processed securely through our payment provider (we don't store card details)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg text-foreground mb-3">How We Use Your Information</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>To provide and maintain the Lovers' Quarrel service</li>
                <li>To personalize your experience and remember your preferences</li>
                <li>To provide AI-powered analysis features (premium subscribers only)</li>
                <li>To process subscriptions and payments</li>
                <li>To communicate with you about your account or support requests</li>
                <li>To improve our app and develop new features</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg text-foreground mb-3">Data Storage & Security</h2>
              <p>
                Your data is stored securely using industry-standard encryption. We use secure cloud infrastructure to protect your information. Your game responses are private and only accessible to you and, in multiplayer sessions, your partner during active gameplay.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg text-foreground mb-3">Data Sharing</h2>
              <p>
                We do not sell your personal data. We may share data only in these limited circumstances:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>With service providers who help operate our app (e.g., payment processing, cloud hosting)</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and safety, or that of our users</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg text-foreground mb-3">Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Access your personal data</li>
                <li>Delete your account and associated data (via Settings &gt; Reset All Data)</li>
                <li>Export your data upon request</li>
                <li>Opt out of marketing communications</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg text-foreground mb-3">Age Restriction</h2>
              <p>
                Lovers' Quarrel is intended for users 18 years of age and older. We do not knowingly collect information from users under 18. If you believe a minor has provided us with personal data, please contact us.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg text-foreground mb-3">Changes to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. We will notify you of significant changes through the app or via email.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg text-foreground mb-3">Contact Us</h2>
              <p>
                If you have questions about this privacy policy or your data, please contact us at:
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

export default PrivacyPolicy;