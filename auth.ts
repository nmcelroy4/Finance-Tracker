import { type NextRequest, NextResponse } from "next/server";

const unauthorized = () =>
	new NextResponse("Authentication required", {
		status: 401,
		headers: { "WWW-Authenticate": 'Basic realm="Expense Tracker"' },
	});

export function middleware(request: NextRequest) {
	const username = process.env.EXPENSE_TRACKER_AUTH_USER;
	const password = process.env.EXPENSE_TRACKER_AUTH_PASSWORD;

	// Local development remains frictionless. A production deployment must be
	// configured explicitly, rather than accidentally exposing financial data.
	if (!username || !password) {
		if (process.env.NODE_ENV !== "production") return NextResponse.next();
		return new NextResponse(
			"Expense Tracker authentication is not configured",
			{ status: 503 },
		);
	}

	const authorization = request.headers.get("authorization");
	if (!authorization?.startsWith("Basic ")) return unauthorized();

	try {
		const credentials = atob(authorization.slice("Basic ".length));
		return credentials === `${username}:${password}`
			? NextResponse.next()
			: unauthorized();
	} catch {
		return unauthorized();
	}
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
