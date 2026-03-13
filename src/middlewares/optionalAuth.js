const passport = require('passport');

const optionalAuth = () => (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (!err && user) {
      req.user = user;
    }

    next();
  })(req, res, next);
};

module.exports = optionalAuth;
