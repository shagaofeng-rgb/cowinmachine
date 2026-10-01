export const runtime = "nodejs";

function disabled() {
  return Response.json({ error: "News publication automation is disabled." }, { status: 410 });
}

export const GET = disabled;
export const POST = disabled;
