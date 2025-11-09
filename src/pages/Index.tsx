import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AgeGate from '@/components/AgeGate';

const Index = () => {
  const navigate = useNavigate();
  const [hasAccepted, setHasAccepted] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('lq_age_verified');
    if (accepted === 'true') {
      navigate('/home');
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
