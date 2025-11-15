import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AgeGate from '@/components/AgeGate';

const Index = () => {
  const navigate = useNavigate();
  const [hasAccepted, setHasAccepted] = useState(false);

  useEffect(() => {
    const onboardingCompleted = localStorage.getItem('lq_onboarding_completed');
    const ageVerified = localStorage.getItem('lq_age_verified');
    
    if (onboardingCompleted === 'true' && ageVerified === 'true') {
      navigate('/home');
    } else if (onboardingCompleted !== 'true') {
      navigate('/onboarding');
    } else {
      setHasAccepted(false);
    }
  }, [navigate]);

  const handleAccept = () => {
    localStorage.setItem('lq_age_verified', 'true');
    setHasAccepted(true);
    navigate('/home');
  };

  return <AgeGate onAccept={handleAccept} />;
};

export default Index;
