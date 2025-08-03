import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
	public state: State = {
		hasError: false
	};

	public static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error('ErrorBoundary caught an error:', error, errorInfo);
	}

	public render() {
		if (this.state.hasError) {
			return this.props.fallback || (
				<div className="alert alert-danger m-3">
					<h4>🚨 Something went wrong</h4>
					<p>An error occurred while loading this component.</p>
					<button
						className="btn btn-outline-danger btn-sm"
						onClick={() => this.setState({ hasError: false, error: undefined })}
					>
						Try Again
					</button>
				</div>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
