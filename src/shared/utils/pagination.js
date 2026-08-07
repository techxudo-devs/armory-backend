export const getPaginatedData = async ({
  model,
  query = {},
  page = 1,
  limit = 10,
  sort = { createdAt: -1 },
  populate = "",
  select = "",
}) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (parsedPage - 1) * parsedLimit;
  const totalDocs = await model.countDocuments(query);
  const totalPages = Math.ceil(totalDocs / parsedLimit);

  let queryBuilder = model
    .find(query)
    .sort(sort)
    .skip(skip)
    .limit(parsedLimit)
    .select(select);

  if (populate) {
    queryBuilder = queryBuilder.populate(populate);
  }

  const docs = await queryBuilder.exec();

  return {
    docs,
    pagination: {
      totalDocs,
      totalPages,
      currentPage: parsedPage,
      limit: parsedLimit,
      hasNextPage: parsedPage < totalPages,
      hasPrevPage: parsedPage > 1,
    },
  };
};
