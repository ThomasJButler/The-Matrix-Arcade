import { useState, useEffect } from 'react';

export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      // Check user agent
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      const tabletRegex = /ipad|tablet|playbook|silk|(android(?!.*mobile))/i;
      
      const isMobileDevice = mobileRegex.test(userAgent);
      const isTabletDevice = tabletRegex.test(userAgent);
      
      // Also check for touch support and screen size
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      const isMediumScreen = window.innerWidth >= 768 && window.innerWidth < 1024;
      
      // Combine checks
      setIsMobile(isMobileDevice || (hasTouch && isSmallScreen));
      setIsTablet(isTabletDevice || (hasTouch && isMediumScreen));
    };

    // Initial check
    checkDevice();

    // Re-check on resize
    window.addEventListener('resize', checkDevice);
    
    // Also check on orientation change
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0
  };
};