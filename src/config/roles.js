const allRoles = {
  user: [],
  admin: [
    'getUsers',
    'manageUsers',
    'getBookings',
    'manageBookings',
    'getVehicles',
    'manageVehicles',
    'getExtras',
    'manageExtras',
    'getServices',
    'manageServices',
    'manageSchedule',
    'getBlogs',
    'manageBlogs',
    'manageAffiliates',
  ],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
