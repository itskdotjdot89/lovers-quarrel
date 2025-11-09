import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { SpiceLevel } from '@/types/game';

const Settings = () => {
  const navigate = useNavigate();
  const [intensity, setIntensity] = useState<SpiceLevel>('standard');

  useEffect(() => {
    const stored = localStorage.getItem('lq_default_intensity');
    if (stored) {
      setIntensity(stored as SpiceLevel);
    }
  }, []);

  const handleIntensityChange = (level: SpiceLevel) => {
    setIntensity(level);
    localStorage.setItem('lq_default_intensity', level);
  };

  const handleReset = () => {
    if (confirm('Reset all data including favorites?')) {
      localStorage.clear();
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-foreground hover:text-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display text-3xl ml-4 text-foreground">
            Settings
          </h1>
        </div>

        <div className="space-y-4">
          {/* Default Intensity */}
          <Card className="p-6 bg-card border-2 border-border">
            <label className="block font-display text-lg mb-4 text-foreground">
              Default Content Intensity
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['soft', 'standard', 'spicy'] as SpiceLevel[]).map((level) => (
                <Button
                  key={level}
                  onClick={() => handleIntensityChange(level)}
                  variant={intensity === level ? 'default' : 'outline'}
                  className={
                    intensity === level
                      ? 'bg-secondary hover:bg-secondary/90 text-foreground'
                      : 'border-border text-muted-foreground hover:border-secondary'
                  }
                >
                  <span className="capitalize font-card">{level}</span>
                </Button>
              ))}
            </div>
          </Card>

          {/* About */}
          <Card className="p-6 bg-card border-2 border-border">
            <h2 className="font-display text-lg mb-3 text-foreground">
              About Lovers' Quarrel
            </h2>
            <div className="space-y-2 font-card text-sm text-muted-foreground">
              <p>Version 1.0.0</p>
              <p>An intimate card game for couples</p>
              <p className="pt-4 text-xs">
                18+ only • Play responsibly • Respect boundaries
              </p>
            </div>
          </Card>

          {/* Legal */}
          <Card className="p-6 bg-card border-2 border-border">
            <h2 className="font-display text-lg mb-3 text-foreground">
              Legal
            </h2>
            <div className="space-y-2 font-ui text-sm text-muted-foreground">
              <button className="block hover:text-secondary transition-colors">
                Privacy Policy
              </button>
              <button className="block hover:text-secondary transition-colors">
                Terms of Service
              </button>
              <button className="block hover:text-secondary transition-colors">
                Content Warning
              </button>
            </div>
          </Card>

          {/* Data Management */}
          <Card className="p-6 bg-card border-2 border-border">
            <h2 className="font-display text-lg mb-3 text-foreground">
              Data Management
            </h2>
            <Button
              onClick={handleReset}
              variant="destructive"
              className="w-full"
            >
              Reset All Data
            </Button>
            <p className="text-xs text-muted-foreground font-ui mt-2">
              This will clear all favorites and preferences
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
