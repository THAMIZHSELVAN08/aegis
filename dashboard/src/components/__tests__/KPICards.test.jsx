import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import KPICards from '../KPICards';

describe('KPICards Component', () => {
    test('renders all 4 primary KPI cards correctly for normal state', () => {
        render(
            <KPICards
                prediction="NORMAL"
                confidence={0.95}
                totalSamples={1250}
                attackCount={12}
            />
        );

        expect(screen.getByText(/SYSTEM STATUS/i)).toBeInTheDocument();
        expect(screen.getByText("NORMAL")).toBeInTheDocument();
        expect(screen.getByText(/MODEL CONFIDENCE/i)).toBeInTheDocument();
        expect(screen.getByText(/95.0%/i)).toBeInTheDocument();
        expect(screen.getByText(/SAMPLES PROCESSED/i)).toBeInTheDocument();
        expect(screen.getByText(/1,250/i)).toBeInTheDocument();
        expect(screen.getByText(/ATTACKS DETECTED/i)).toBeInTheDocument();
        expect(screen.getByText(/12/i)).toBeInTheDocument();
    });

    test('renders attack status properly on high confidence attack', () => {
        render(
            <KPICards
                prediction="ATTACK DETECTED"
                confidence={0.91}
                totalSamples={500}
                attackCount={45}
            />
        );

        expect(screen.getByText(/SYSTEM STATUS/i)).toBeInTheDocument();
        expect(screen.getByText("ATTACK")).toBeInTheDocument();
        expect(screen.getByText(/91.0%/i)).toBeInTheDocument();
    });
});
