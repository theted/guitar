import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders app header and settings button", () => {
  render(<App />);
  expect(screen.getByText(/Guitar Scale Finder/i)).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: /settings/i }).length).toBeGreaterThan(0);
});
