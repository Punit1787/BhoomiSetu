export function documentMediaType(
  file: Pick<File, "type" | "name">,
): string | null {
  const type = file.type.toLowerCase();
  if (["image/png", "image/jpeg", "image/tiff"].includes(type)) return type;
  if (type === "image/jpg" || type === "image/pjpeg") return "image/jpeg";
  if (type === "image/x-tiff") return "image/tiff";
  if (type && type !== "application/octet-stream") return null;
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "png") return "image/png";
  if (["jpg", "jpeg", "jfif"].includes(extension ?? "")) return "image/jpeg";
  if (["tif", "tiff"].includes(extension ?? "")) return "image/tiff";
  return null;
}
