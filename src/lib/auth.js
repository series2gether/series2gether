module.exports = {
    isLoggedIn(req, res, next) {
        if(req.isAuthenticated()) {
            return next();
        }
        return res.redirect('/user/login');
    },

    isNotLoggedIn(req, res, next) {
        if(!req.isAuthenticated()) {
            return next();
        }
        return res.redirect('/user/profile');
    },

    isAdmin(req, res, next) {
        if(req.user.profileId === 4) {
            return next();
        }
        return res.redirect('/user/login');
    }
}