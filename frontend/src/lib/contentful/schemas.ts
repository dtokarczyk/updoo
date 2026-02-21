import { z } from 'zod';

export const contentfulAssetSchema = z.object({
  fields: z.object({
    title: z.string(),
    file: z.object({
      url: z.string(),
      details: z.object({
        image: z.object({
          width: z.number(),
          height: z.number(),
        }),
      }),
    }),
  }),
});

export const contentfulRichTextSchema: z.ZodType<{
  nodeType: string;
  content?: Array<unknown>;
  value?: string;
  data?: Record<string, unknown>;
  marks?: Array<{ type: string }>;
}> = z.lazy(() =>
  z.object({
    nodeType: z.string(),
    content: z.array(contentfulRichTextSchema).optional(),
    value: z.string().optional(),
    data: z.record(z.string(), z.unknown()).optional(),
    marks: z
      .array(
        z.object({
          type: z.string(),
        }),
      )
      .optional(),
  }),
);

export const contentfulHoploBlogSchema = z.object({
  fields: z.object({
    title: z.string(),
    slug: z.string(),
    lead: z.string().optional(),
    body: contentfulRichTextSchema.optional(),
    mainImage: contentfulAssetSchema.optional(),
    metaTitle: z.string(),
    metaDescription: z.string(),
  }),
  sys: z.object({
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

export type ContentfulAsset = z.infer<typeof contentfulAssetSchema>;
export type ContentfulRichText = z.infer<typeof contentfulRichTextSchema>;
export type ContentfulHoploBlog = z.infer<typeof contentfulHoploBlogSchema>;
