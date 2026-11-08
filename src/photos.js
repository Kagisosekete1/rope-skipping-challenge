export async function preparePhoto(file) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Choose a JPG, PNG or WebP photo.");
  if (file.size > 15 * 1024 * 1024)
    throw new Error("Choose a photo smaller than 15 MB.");
  const url = URL.createObjectURL(file);
  let image;
  try {
    image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("This photo could not be opened."));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const crop = Math.min(image.width, image.height);
    ctx.drawImage(
      image,
      (image.width - crop) / 2,
      (image.height - crop) / 2,
      crop,
      crop,
      0,
      0,
      512,
      512,
    );
    const blob = await new Promise((r) => canvas.toBlob(r, "image/webp", 0.85));
    if (!blob || blob.size > 2 * 1024 * 1024)
      throw new Error("Could not prepare this photo. Try another image.");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}
