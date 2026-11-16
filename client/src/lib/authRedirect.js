export function getDashboardPath(user) {
  switch (user?.role) {
    case "super_admin":
      return "/";

    case "org_admin":
    case "admin":
      return "/";

    case "team_owner":
      return "/team";

    case "player":
      return "/registration";

    case "auctioneer":
      return "/auction";

    case "scorer":
      return "/scorer";

    default:
      return "/";
  }
}
