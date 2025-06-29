
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SecurityEvent {
  type: 'auth_failure' | 'suspicious_activity' | 'rate_limit_exceeded';
  details: string;
  timestamp: Date;
}

export const useSecurityMonitoring = () => {
  const { user } = useAuth();

  const logSecurityEvent = async (event: SecurityEvent) => {
    try {
      // In a production app, you'd send this to a security monitoring service
      console.warn('Security Event:', event);
      
      // For now, we'll just log to console and could extend to send to audit logs
      if (event.type === 'auth_failure') {
        // Could implement additional logic here like temporary account lockouts
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  const monitorAuthFailures = () => {
    // Monitor for authentication failures
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('Invalid login credentials') || 
          message.includes('Authentication failed')) {
        logSecurityEvent({
          type: 'auth_failure',
          details: message,
          timestamp: new Date()
        });
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  };

  useEffect(() => {
    const cleanup = monitorAuthFailures();
    return cleanup;
  }, []);

  return { logSecurityEvent };
};
