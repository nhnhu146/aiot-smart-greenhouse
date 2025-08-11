import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../../../src/contexts/ToastContext';

// Test component to use the toast context
const TestComponent = () => {
	const { showToast, messages } = useToast();

	return (
		<div>
			<button onClick={() => showToast('Test message', 'success')}>
				Show Toast
			</button>
			<button onClick={() => showToast('Error message', 'error')}>
				Show Error
			</button>
			<div data-testid="toasts">
				{messages.map((toast: any) => (
					<div key={toast.id} data-testid={`toast-${toast.variant}`}>
						{toast.message}
					</div>
				))}
			</div>
		</div>
	);
};

describe('ToastContext', () => {
	it('should show success toast', async () => {
		const { getByText, getByTestId } = render(
			<ToastProvider>
				<TestComponent />
			</ToastProvider>
		);

		const button = getByText('Show Toast');

		await act(async () => {
			button.click();
		});

		expect(getByTestId('toast-success')).toBeInTheDocument();
		// Use getByTestId instead of getByText to avoid multiple elements issue
		expect(getByTestId('toast-success')).toHaveTextContent('Test message');
	});

	it('should show error toast', async () => {
		const { getByText, getByTestId } = render(
			<ToastProvider>
				<TestComponent />
			</ToastProvider>
		);

		const button = getByText('Show Error');

		await act(async () => {
			button.click();
		});

		expect(getByTestId('toast-error')).toBeInTheDocument();
		// Use getByTestId instead of getByText to avoid multiple elements issue
		expect(getByTestId('toast-error')).toHaveTextContent('Error message');
	});

	it('should auto-dismiss toasts after timeout', async () => {
		vi.useFakeTimers();

		const { getByText, getByTestId, queryByTestId } = render(
			<ToastProvider>
				<TestComponent />
			</ToastProvider>
		);

		const button = getByText('Show Toast');

		await act(async () => {
			button.click();
		});

		expect(getByTestId('toast-success')).toBeInTheDocument();

		// Fast-forward time
		await act(async () => {
			vi.advanceTimersByTime(5000);
		});

		expect(queryByTestId('toast-success')).not.toBeInTheDocument();

		vi.useRealTimers();
	});
});
