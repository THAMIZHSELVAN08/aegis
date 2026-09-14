import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PredictionHistory from '../PredictionHistory';

describe('PredictionHistory Component', () => {
    test('renders empty history without crashing', () => {
        const { container } = render(<PredictionHistory history={[]} />);
        expect(container).toBeInTheDocument();
    });

    test('renders list of past prediction events', () => {
        const mockHistory = [
            {
                prediction: 'NORMAL',
                confidence: 0.99,
                groundTruth: 'Clean Baseline',
                timestamp: '12:00:01',
            },
            {
                prediction: 'ATTACK DETECTED',
                confidence: 0.94,
                groundTruth: 'Voltage Manipulation',
                timestamp: '12:00:03',
            },
        ];

        render(<PredictionHistory history={mockHistory} />);
        expect(screen.getByText(/NORMAL/i)).toBeInTheDocument();
        expect(screen.getByText(/ATTACK DETECTED/i)).toBeInTheDocument();
        const matches = screen.getAllByText(/Voltage Manipulation/i);
        expect(matches.length).toBeGreaterThanOrEqual(1);
    });
});
