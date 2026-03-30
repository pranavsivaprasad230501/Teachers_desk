export function isMissingSchemaError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("Could not find the table") ||
    error.message.includes("schema cache") ||
    error.message.includes('relation "public.')
  );
}
