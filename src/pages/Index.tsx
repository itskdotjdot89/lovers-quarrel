import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AgeGate from '@/components/AgeGate';

const Index = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // User is logged in - go directly to home
        // Also set localStorage flags so they don't see onboarding again
        localStorage.setItem('lq_onboarding_completed', 'true');
        localStorage.setItem('lq_age_verified', 'true');
        navigate('/home');
        return;
      }
      
      // User is not logged in - check onboarding status
      const onboardingCompleted = localStorage.getItem('lq_onboarding_completed');
      const ageVerified = localStorage.getItem('lq_age_verified');
      
      if (onboardingCompleted === 'true' && ageVerified === 'true') {
        navigate('/home');
      } else if (onboardingCompleted !== 'true') {
        navigate('/onboarding');
      } else {
        setIsLoading(false);
      }
    };

    checkAuthAndOnboarding();
  }, [navigate]);

  const handleAccept = () => {
    localStorage.setItem('lq_age_verified', 'true');
    navigate('/home');
  };

  if (isLoading) {
    return null;
  }

  return <AgeGate onAccept={handleAccept} />;
};

export default Index;
