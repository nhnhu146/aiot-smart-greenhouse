// Force dynamic rendering to fix useContext static generation issues
export const dynamic = 'force-dynamic';

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<div style={{ backgroundColor: "#DCEECB", minHeight: "100vh" }}>{children}</div>
	)
}
