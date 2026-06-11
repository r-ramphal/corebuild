import aws4 from "aws4";
import type { PriceResult } from "./types";

const HOST = "webservices.amazon.nl";
const REGION = "eu-west-1";
const PATH = "/paapi5/searchitems";

interface PaApiItem {
  ASIN?: string;
  DetailPageURL?: string;
  ItemInfo?: {
    Title?: { DisplayValue?: string };
  };
  Images?: {
    Primary?: { Medium?: { URL?: string } };
  };
  Offers?: {
    Listings?: Array<{
      Price?: { Amount?: number; Currency?: string };
      Availability?: { Type?: string };
    }>;
  };
}

interface PaApiResponse {
  SearchResult?: {
    Items?: PaApiItem[];
  };
  Errors?: Array<{ Code: string; Message: string }>;
}

export async function searchAmazon(query: string): Promise<PriceResult[]> {
  const accessKey = process.env.AMAZON_ACCESS_KEY;
  const secretKey = process.env.AMAZON_SECRET_KEY;
  const associateTag = process.env.AMAZON_ASSOCIATE_TAG;

  if (!accessKey || !secretKey || !associateTag) {
    throw new Error("Amazon PA API credentials not configured");
  }

  const body = JSON.stringify({
    Keywords: query,
    Resources: [
      "ItemInfo.Title",
      "Offers.Listings.Price",
      "Offers.Listings.Availability.Type",
      "Images.Primary.Medium",
    ],
    SearchIndex: "Electronics",
    ItemCount: 10,
    PartnerTag: associateTag,
    PartnerType: "Associates",
    Marketplace: "www.amazon.nl",
  });

  const opts = aws4.sign(
    {
      host: HOST,
      region: REGION,
      service: "ProductAdvertisingAPI",
      method: "POST",
      path: PATH,
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-Amz-Target": "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems",
      },
      body,
    },
    { accessKeyId: accessKey, secretAccessKey: secretKey },
  );

  const res = await fetch(`https://${HOST}${PATH}`, {
    method: "POST",
    headers: opts.headers as Record<string, string>,
    body,
    next: { revalidate: 300 }, // cache 5 min
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Amazon PA API ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as PaApiResponse;

  if (data.Errors?.length) {
    throw new Error(data.Errors[0].Message);
  }

  return (data.SearchResult?.Items ?? []).flatMap((item): PriceResult[] => {
    const listing = item.Offers?.Listings?.[0];
    const price = listing?.Price?.Amount;
    if (!price) return [];

    return [
      {
        retailer: "amazon",
        name: item.ItemInfo?.Title?.DisplayValue ?? "Onbekend",
        priceEur: price,
        url: item.DetailPageURL ?? `https://www.amazon.nl/dp/${item.ASIN}`,
        imageUrl: item.Images?.Primary?.Medium?.URL,
        inStock: listing?.Availability?.Type === "Now",
        asin: item.ASIN,
      },
    ];
  });
}
