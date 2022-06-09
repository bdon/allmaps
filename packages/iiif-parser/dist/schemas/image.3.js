// Image API 3.0.0
// https://iiif.io/api/image/3.0/#51-image-information-request
import { z } from 'zod';
import { TilesetSchema, SizeSchema } from './shared.js';
const profiles = ['level0', 'level1', 'level2'];
export const Image3Schema = z.object({
    // '@context': z.literal('http://iiif.io/api/image/2/context.json'),
    id: z.string().url(),
    type: z.literal('ImageService3'),
    protocol: z.literal('http://iiif.io/api/image'),
    profile: z.enum(profiles),
    width: z.number().int(),
    height: z.number().int(),
    maxWidth: z.number().int().optional(),
    maxHeight: z.number().int().optional(),
    maxArea: z.number().int().optional(),
    sizes: SizeSchema.array().optional(),
    tiles: TilesetSchema.array().optional(),
    extraFeatures: z.string().array().optional()
    // TODO: add partOf, seeAlso, and service
});
