import ApiError from "../shared/errors/apiError.js";

export const errorHandler = (err, req, res, next) => {
  let error = { ...err };

  error.message = err.message;
  if (process.env.NODE_ENV === "development") {
    console.error("[ERROR]", err);
  }

  if (err.name === "CastError") {
    const message = `Resource not found with id of ${err.value}`;
    error = new ApiError(404, message);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate value entered for ${field} field.`;
    error = new ApiError(400, message);
  }

  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = new ApiError(400, message);
  }
  
  res.status(error.statusCode || 500).json({
    success: false,
    statusCode: error.statusCode || 500,
    message: error.message || "Internal Server Error",
    errors: error.errors || [],
  });
};
