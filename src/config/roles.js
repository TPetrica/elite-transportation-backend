const allRoles = {
  user: [],
  admin: [
    'getUsers',
    'manageUsers',
    'getBookings',
    'manageBookings',
    'getExtras',
    'manageExtras',
    'getServices',
    'manageServices',
    'manageSchedule',
    'getBlogs',
    'manageBlogs',
    'manageAffiliates',
    'getManualBookings',
    'manageManualBookings',
  ],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
