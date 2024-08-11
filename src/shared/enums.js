export const userRolesEnum = {
  none: null,
  ghost: "ghost",
  viewer: "viewer",
  new_user: "new_user",
  pending_approve: "pending_approve",
  user: "user",
};

export const getUserRole = () => {
  return userRolesEnum.user;
};

export const isServiceID = (id) => {
  return ["webout", "qstout", "sdiout"].includes(id);
}
