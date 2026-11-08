export async function preparePhoto(file) {
  if (file.type && !file.type.startsWith("image/"))
    throw new Error("Choose a photo from your gallery.");
  if (file.size > 15 * 1024 * 1024)
    throw new Error("Choose a photo smaller than 15 MB.");
  const url = URL.createObjectURL(file);
  let image;
  try {
    image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(/heic|heif/i.test(file.type + file.name) ? "This phone cannot open HEIC here. Export the photo as JPG or choose a screenshot, then try again." : "This photo could not be opened. Try a JPG, PNG or a screenshot."));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Photo editing is unavailable. Try opening the game in your browser.");
    const crop = Math.min(image.naturalWidth || image.width, image.naturalHeight || image.height);
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
    const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.88));
    if (!blob || blob.size > 2 * 1024 * 1024)
      throw new Error("Could not prepare this photo. Try another image.");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}
