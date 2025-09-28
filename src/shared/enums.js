import logger from '../services/logger';

const NAMESPACE = 'Enums';

export const userRolesEnum = {
  none: null,
  ghost: 'ghost',
  viewer: 'viewer',
  new_user: 'new_user',
  pending_approve: 'pending_approve',
  user: 'user',
};

export const getUserRole = roles => {
  logger.debug(NAMESPACE, 'getUserRole', roles);
  if (!roles) return userRolesEnum.none;

  switch (true) {
    case roles.some(r => r === 'pending_approval'):
      return userRolesEnum.ghost;
    case roles.some(r => r === 'gxy_user'):
      return userRolesEnum.user;
    case roles.some(r => r === 'gxy_pending_approval'):
      return userRolesEnum.pending_approve;
    case roles.some(r => r === 'gxy_guest'):
      return userRolesEnum.viewer;
    case roles.some(r => r === 'new_user'):
      return userRolesEnum.new_user;
    default:
      return userRolesEnum.none;
  }
};
