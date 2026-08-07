import ApiError from "../shared/errors/apiError.js";

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ApiError(
          `403, User role '${req.user?.role}' is not authorized to access this route.`,
        ),
      );
    }
    next();
  };
};
