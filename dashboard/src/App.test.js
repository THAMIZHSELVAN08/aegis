import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from './components/Header';

describe('Header Component', () => {
    test('renders Smart Grid header and integrity badges', () => {
        render(<Header gridHealth={95} totalBuses={14} healthyBuses={14} />);
        expect(screen.getByText(/IEEE 14-Bus Real-Time Platform/i)).toBeInTheDocument();
        const liveElements = screen.getAllByText(/LIVE/i);
        expect(liveElements.length).toBeGreaterThanOrEqual(1);
    });
});
