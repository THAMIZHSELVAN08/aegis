import { render, screen } from '@testing-library/react';
import App from './App';

test('renders AEGIS brand header', () => {
  render(<App />);
  const brandElement = screen.getByText(/AEGIS/i);
  expect(brandElement).toBeInTheDocument();
});
