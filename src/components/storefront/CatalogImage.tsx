import { PLACEHOLDER_IMAGE, imageSrc } from "./catalogApi";

interface CatalogImageProps {
  image: string;
  alt: string;
  className?: string;
}

/** A catalog picture that falls back to the placeholder when the file is missing. */
export default function CatalogImage({ image, alt, className }: CatalogImageProps) {
  return (
    <img
      src={imageSrc(image)}
      alt={alt}
      className={className}
      onError={(e) => {
        const img = e.currentTarget;
        if (!img.src.endsWith(PLACEHOLDER_IMAGE)) img.src = PLACEHOLDER_IMAGE;
      }}
    />
  );
}
