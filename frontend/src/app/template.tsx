// Disable static generation for all routes in this segment
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function RootTemplate({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
