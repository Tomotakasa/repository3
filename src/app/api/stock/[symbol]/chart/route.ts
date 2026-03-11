import { NextRequest, NextResponse } from "next/server";
import { fetchChart } from "@/lib/finnhub";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const period = req.nextUrl.searchParams.get("period") ?? "3M";
  const data = await fetchChart(symbol.toUpperCase(), period);
  return NextResponse.json(data);
}
