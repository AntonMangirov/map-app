import { z } from "zod";

export const WMSGetCapabilitiesSchema = z.object({
  WMS_Capabilities: z.object({
    Service: z.object({
      Name: z.string(),
      Title: z.string(),
      Abstract: z.string().optional(),
      OnlineResource: z.object({
        "xlink:href": z.string(),
      }),
    }),
    Capability: z.object({
      Request: z.object({
        GetMap: z.object({
          Format: z.array(z.string()),
          DCPType: z.array(
            z.object({
              HTTP: z.object({
                Get: z.object({
                  OnlineResource: z.object({
                    "xlink:href": z.string(),
                  }),
                }),
              }),
            })
          ),
        }),
      }),
      Layer: z.object({
        Name: z.string().optional(),
        Title: z.string().optional(),
        Abstract: z.string().optional(),
        Layer: z
          .array(
            z.object({
              Name: z.string(),
              Title: z.string(),
              Abstract: z.string().optional(),
              SRS: z.array(z.string()).optional(),
              BoundingBox: z
                .array(
                  z.object({
                    minx: z.number(),
                    miny: z.number(),
                    maxx: z.number(),
                    maxy: z.number(),
                    SRS: z.string(),
                  })
                )
                .optional(),
            })
          )
          .optional(),
      }),
    }),
  }),
});

export const WMSGetMapResponseSchema = z.object({
  contentType: z.string(),
  data: z.instanceof(ArrayBuffer),
});

export const WFSGeometrySchema = z.object({
  type: z.enum([
    "Point",
    "LineString",
    "Polygon",
    "MultiPoint",
    "MultiLineString",
    "MultiPolygon",
  ]),
  coordinates: z.array(
    z.union([
      z.number(),
      z.array(z.number()),
      z.array(z.array(z.number())),
      z.array(z.array(z.array(z.number()))),
    ])
  ),
});

export const WFSFeatureSchema = z.object({
  type: z.literal("Feature"),
  id: z.string().optional(),
  geometry: WFSGeometrySchema.optional(),
  properties: z.record(z.unknown()),
});

export const WFSFeatureCollectionSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(WFSFeatureSchema),
  totalFeatures: z.number().optional(),
  numberMatched: z.number().optional(),
  numberReturned: z.number().optional(),
  timeStamp: z.string().optional(),
  crs: z
    .object({
      type: z.string(),
      properties: z.object({
        name: z.string(),
      }),
    })
    .optional(),
});

export const WFSCapabilitiesSchema = z.object({
  WFS_Capabilities: z.object({
    Service: z.object({
      Name: z.string(),
      Title: z.string(),
      Abstract: z.string().optional(),
      OnlineResource: z.object({
        "xlink:href": z.string(),
      }),
    }),
    Capability: z.object({
      Request: z.object({
        GetFeature: z.object({
          ResultFormat: z.array(z.string()),
          DCPType: z.array(
            z.object({
              HTTP: z.object({
                Post: z.object({
                  OnlineResource: z.object({
                    "xlink:href": z.string(),
                  }),
                }),
              }),
            })
          ),
        }),
      }),
      FeatureTypeList: z.object({
        FeatureType: z.array(
          z.object({
            Name: z.string(),
            Title: z.string(),
            Abstract: z.string().optional(),
            DefaultSRS: z.string().optional(),
            OtherSRS: z.array(z.string()).optional(),
            OutputFormats: z
              .object({
                Format: z.array(z.string()),
              })
              .optional(),
            WGS84BoundingBox: z
              .object({
                minx: z.number(),
                miny: z.number(),
                maxx: z.number(),
                maxy: z.number(),
              })
              .optional(),
          })
        ),
      }),
    }),
  }),
});

export const WMSErrorResponseSchema = z.object({
  ServiceExceptionReport: z.object({
    ServiceException: z.object({
      code: z.string().optional(),
      locator: z.string().optional(),
      message: z.string(),
    }),
  }),
});

export const WFSErrorResponseSchema = z.object({
  ExceptionReport: z.object({
    Exception: z.object({
      exceptionCode: z.string().optional(),
      locator: z.string().optional(),
      ExceptionText: z.string(),
    }),
  }),
});

export type WMSGetCapabilitiesResponse = z.infer<
  typeof WMSGetCapabilitiesSchema
>;
export type WMSGetMapResponse = z.infer<typeof WMSGetMapResponseSchema>;
export type WFSGeometry = z.infer<typeof WFSGeometrySchema>;
export type WFSFeature = z.infer<typeof WFSFeatureSchema>;
export type WFSFeatureCollection = z.infer<typeof WFSFeatureCollectionSchema>;
export type WFSCapabilitiesResponse = z.infer<typeof WFSCapabilitiesSchema>;
export type WMSErrorResponse = z.infer<typeof WMSErrorResponseSchema>;
export type WFSErrorResponse = z.infer<typeof WFSErrorResponseSchema>;

export function validateWMSResponse(data: unknown): WMSGetCapabilitiesResponse {
  try {
    return WMSGetCapabilitiesSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `WMS response validation failed: ${error.errors
          .map((e) => e.message)
          .join(", ")}`
      );
    }
    throw error;
  }
}

export function validateWFSResponse(data: unknown): WFSFeatureCollection {
  try {
    return WFSFeatureCollectionSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `WFS response validation failed: ${error.errors
          .map((e) => e.message)
          .join(", ")}`
      );
    }
    throw error;
  }
}

export function validateWMSErrorResponse(data: unknown): WMSErrorResponse {
  try {
    return WMSErrorResponseSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `WMS error response validation failed: ${error.errors
          .map((e) => e.message)
          .join(", ")}`
      );
    }
    throw error;
  }
}

export function validateWFSErrorResponse(data: unknown): WFSErrorResponse {
  try {
    return WFSErrorResponseSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `WFS error response validation failed: ${error.errors
          .map((e) => e.message)
          .join(", ")}`
      );
    }
    throw error;
  }
}
