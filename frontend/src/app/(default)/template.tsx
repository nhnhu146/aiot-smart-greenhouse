// Disable static generation for all default routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function DefaultTemplate({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
