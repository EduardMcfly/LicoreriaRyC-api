import sharp, {
  AvailableFormatInfo,
  FormatEnum,
  OutputInfo,
} from 'sharp';

sharp.cache({ items: 20 });

export interface PropsResize {
  file: Buffer | string;
  format?: keyof FormatEnum | AvailableFormatInfo;
  width?: number;
  height?: number;
}

export default async function resize({
  file,
  format,
  width,
  height,
}: PropsResize): Promise<{
  data: Buffer;
  info: OutputInfo;
}> {
  let transform = sharp(file);

  if (format) {
    try {
      transform = transform.toFormat(format);
    } catch (error) {
      throw error;
    }
  }

  if (width || height) {
    transform = transform.resize(width, height, {
      withoutEnlargement: true,
    });
  }
  return transform.toBuffer({ resolveWithObject: true });
}
