import { RoleName } from '@prisma/client';

export interface Permission {
  view: boolean;
  create?: boolean;
  update?: boolean;
  delete?: boolean;
  manage?: boolean;
}

export interface RolePermissionsStructure {
  users: Permission;
  dashboard: Permission;
  profile: Permission;
  audit: Permission;
}

export const DEFAULT_ROLE_PERMISSIONS: Record<RoleName, RolePermissionsStructure> = {
  [RoleName.ADMIN]: {
    users: {
      view: true,
      create: true,
      update: true,
      delete: true,
      manage: true,
    },
    dashboard: {
      view: true,
    },
    profile: {
      view: true,
      update: true,
    },
    audit: {
      view: true,
    },
  },
  [RoleName.ATENDENTE]: {
    users: {
      view: false,
      create: false,
      update: false,
      delete: false,
      manage: false,
    },
    dashboard: {
      view: true,
    },
    profile: {
      view: true,
      update: true,
    },
    audit: {
      view: false,
    },
  },
  [RoleName.PRODUÇÃO]: {
    users: {
      view: false,
      create: false,
      update: false,
      delete: false,
      manage: false,
    },
    dashboard: {
      view: true,
    },
    profile: {
      view: true,
      update: true,
    },
    audit: {
      view: false,
    },
  },
  [RoleName.CAIXA]: {
    users: {
      view: false,
      create: false,
      update: false,
      delete: false,
      manage: false,
    },
    dashboard: {
      view: true,
    },
    profile: {
      view: true,
      update: true,
    },
    audit: {
      view: false,
    },
  },
};

