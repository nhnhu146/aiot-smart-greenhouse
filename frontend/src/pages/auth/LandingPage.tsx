import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Image } from 'react-bootstrap';
import styles from './LandingPage.module.scss';

const LandingPage = () => {
	const navigate = useNavigate();

	return (
		<div className={styles.container}>
			<Image
				className={styles.logo}
				src="/logo.svg"
				alt="GreenHouse Logo"
				width={300}
				height={180}
			/>

			<Button
				className={`${styles.button} ${styles.signin}`}
				onClick={() => navigate('/signin')}
			>
				Sign In
			</Button>

			<Button
				className={`${styles.button} ${styles.signup}`}
				onClick={() => navigate('/signup')}
			>
				Sign Up
			</Button>
		</div>
	);
};

export default LandingPage;
