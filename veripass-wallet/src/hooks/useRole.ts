import { useAuth } from '@/contexts/AuthContext';

/**
 * useRole — determines user role based on authenticated identity (Fabric/MSP backed)
 */
export const useRole = () => {
  const { user } = useAuth();

  /**
   * Get a user's role string.
   */
  const getUserRole = async (): Promise<string> => {
    return user?.role || 'CITIZEN';
  };

  /**
   * Check if a user is an ISSUER_OFFICER (University/Govt Issuer)
   */
  const isVerifiedIssuer = async (): Promise<boolean> => {
    return user?.role === 'ISSUER_OFFICER' || user?.role === 'UNIVERSITY';
  };

  /**
   * Check if a user is an ADMIN (MeitY/NIC)
   */
  const isAdmin = async (): Promise<boolean> => {
    return user?.role === 'ADMIN';
  };

  /**
   * Check if a user is an APPROVER
   */
  const isApprover = async (): Promise<boolean> => {
    return user?.role === 'APPROVER';
  };

  return { getUserRole, isVerifiedIssuer, isAdmin, isApprover };
};
