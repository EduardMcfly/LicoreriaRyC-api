import sharp, {
  AvailableFormatInfo,
  FormatEnum,
  OutputInfo,
} from 'sharp';

sharp.cache({ items: 20 });

export type Format = keyof FormatEnum | AvailableFormatInfo;

export interface PropsResize {
  file: Buffer | string;
  format?: Format;
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
