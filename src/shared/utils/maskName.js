export const maskName = (fullName = "") => {
  const name = fullName.trim();
  if (!name) return "";

  const first = name.split(/\s+/)[0] || name;
  if (first.length <= 3) return `${first}......`;
  return `${first.slice(0, 3)}......`;
};
