import { useContracts } from './useContracts';

const ROLE_NAMES: Record<number, string> = {
  0: 'CITIZEN',
  1: 'ISSUER_OFFICER',
  2: 'APPROVER',
  3: 'ADMIN',
};

/**
 * useRole — reads and writes roles DIRECTLY from the RoleManager contract.
 * This is the source of truth for access control. Never use the database for this.
 */
export const useRole = () => {
  const { getSignerAndContracts, getReadOnlyContracts } = useContracts();

  /**
   * Get a user's role as a string by reading directly from the RoleManager contract.
   * No MetaMask popup needed (read-only).
   */
  const getUserRole = async (address: string): Promise<string> => {
    const { roleManager } = getReadOnlyContracts();
    const roleId = await roleManager.getRole(address);
    return ROLE_NAMES[Number(roleId)] || 'CITIZEN';
  };

  /**
   * Assign a role to an address. Requires ADMIN role in MetaMask.
   * 0 = CITIZEN, 1 = ISSUER_OFFICER, 2 = APPROVER, 3 = ADMIN
   */
  const assignRole = async (targetAddress: string, role: number) => {
    const { roleManager } = await getSignerAndContracts();
    const tx = await roleManager.assignRole(targetAddress, role);
    const receipt = await tx.wait();
    return receipt;
  };

  /**
   * Check if an address has the ISSUER_OFFICER role.
   */
  const isVerifiedIssuer = async (address: string): Promise<boolean> => {
    const { roleManager } = getReadOnlyContracts();
    const ISSUER_OFFICER_ROLE = await roleManager.ISSUER_OFFICER_ROLE();
    return await roleManager.hasRole(ISSUER_OFFICER_ROLE, address);
  };

  /**
   * Check if an address is an ADMIN.
   */
  const isAdmin = async (address: string): Promise<boolean> => {
    const { roleManager } = getReadOnlyContracts();
    const ADMIN_ROLE = await roleManager.ADMIN_ROLE();
    return await roleManager.hasRole(ADMIN_ROLE, address);
  };

  /**
   * Check if an address is an APPROVER.
   */
  const isApprover = async (address: string): Promise<boolean> => {
    const { roleManager } = getReadOnlyContracts();
    const APPROVER_ROLE = await roleManager.APPROVER_ROLE();
    return await roleManager.hasRole(APPROVER_ROLE, address);
  };

  return { getUserRole, assignRole, isVerifiedIssuer, isAdmin, isApprover };
};
