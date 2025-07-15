// Disable static generation for all auth routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AuthTemplate({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
