export function isDuplicateKeyError(error) {
  return error.code === 11000;
}
