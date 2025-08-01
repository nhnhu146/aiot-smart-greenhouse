import { Container } from 'react-bootstrap';
import withAuth from '@/components/withAuth/withAuth';

const DashboardPage = () => {
	return (
		<Container className="py-4">
			<h2>Smart Greenhouse Dashboard</h2>
			<p>Dashboard content will be implemented here...</p>
		</Container>
	);
};

export default withAuth(DashboardPage);
