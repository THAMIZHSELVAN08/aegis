import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AttackAlert from '../AttackAlert';

describe('AttackAlert Component', () => {
    test('renders NORMAL status when no attack is detected', () => {
        render(<AttackAlert prediction="NORMAL" confidence={0.98} />);
        expect(screen.getByText(/Grid Operating Within Normal Parameters/i)).toBeInTheDocument();
        expect(screen.getByText(/GRID STATE: NOMINAL/i)).toBeInTheDocument();
        expect(screen.getByText(/98.00%/i)).toBeInTheDocument();
    });

    test('renders ATTACK DETECTED alert when attack is flagged', () => {
        render(<AttackAlert prediction="ATTACK DETECTED" confidence={0.875} />);
        expect(screen.getByText(/False Data Injection Attack Detected!/i)).toBeInTheDocument();
        expect(screen.getByText(/THREAT LEVEL: CRITICAL/i)).toBeInTheDocument();
        expect(screen.getByText(/87.50%/i)).toBeInTheDocument();
    });
});
