export const directoryAdminRoles = [
  "zayd_super_admin",
  "zayd_school_admin",
  "nafs_super_admin",
  "nafs_school_admin",
] as const;
export function isDirectoryAdmin(role?: string): boolean {
  return directoryAdminRoles.includes(
    role?.toLowerCase() as (typeof directoryAdminRoles)[number],
  );
}
