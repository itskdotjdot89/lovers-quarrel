import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Mail, MessageCircle, HelpCircle } from 'lucide-react';

const Support = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "How do I play Lovers' Quarrel?",
      answer: "Select a deck, choose your intensity level, and take turns answering the prompts with your partner. It's designed to spark meaningful conversations and deepen your connection."
    },
    {
      question: "What are the different intensity levels?",
      answer: "Soft is for light, getting-to-know-you conversations. Standard covers deeper topics. Spicy includes more intimate and provocative questions for couples comfortable with vulnerability."
    },
    {
      question: "How do I cancel my subscription?",
      answer: "Go to Settings > Manage Subscription to view your billing details and cancel anytime. Your access continues until the end of your billing period."
    },
    {
      question: "Is my data private?",
      answer: "Yes! We take privacy seriously. Your responses are stored securely and never shared. You can delete all your data anytime from Settings."
    },
    {
      question: "Can I play with my partner remotely?",
      answer: "Yes! Use the multiplayer mode to create a session code and share it with your partner. You'll both see the same cards and can share responses in real-time."
    },
    {
      question: "What is AI Analysis?",
      answer: "Premium subscribers can get AI-powered insights on their responses, helping identify themes and patterns in your conversations to deepen understanding."
    }
  ];

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
            Support
          </h1>
        </div>

        <div className="space-y-6">
          {/* Contact Section */}
          <Card className="p-6 bg-card border-2 border-border">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5 text-secondary" />
              <h2 className="font-display text-xl text-foreground">
                Contact Us
              </h2>
            </div>
            <p className="text-muted-foreground font-card mb-4">
              Have a question, feedback, or need help? We're here for you.
            </p>
            <a 
              href="mailto:support@loversquarrel.com"
              className="inline-flex items-center gap-2 text-secondary hover:text-secondary/80 transition-colors font-ui"
            >
              <Mail className="w-4 h-4" />
              support@loversquarrel.com
            </a>
            <p className="text-sm text-muted-foreground mt-3 font-ui">
              We typically respond within 24-48 hours.
            </p>
          </Card>

          {/* FAQ Section */}
          <Card className="p-6 bg-card border-2 border-border">
            <div className="flex items-center gap-2 mb-6">
              <HelpCircle className="w-5 h-5 text-secondary" />
              <h2 className="font-display text-xl text-foreground">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <h3 className="font-card text-foreground mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-sm text-muted-foreground font-ui">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Back to App */}
          <div className="text-center pt-4">
            <Button
              onClick={() => navigate('/home')}
              variant="outline"
              className="border-secondary text-secondary hover:bg-secondary hover:text-foreground"
            >
              Back to Game
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;