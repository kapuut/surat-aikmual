import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: {
    id: string;
  };
};

function parseId(rawId: string): number | null {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const suratId = parseId(params.id);

  if (!suratId) {
    return NextResponse.json({ success: false, error: "ID surat masuk tidak valid" }, { status: 400 });
  }

  const redirectUrl = new URL(`/admin/surat-masuk/${suratId}/preview`, request.url);
  return NextResponse.redirect(redirectUrl);
}