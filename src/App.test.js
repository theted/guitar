import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders controls", () => {
  render(<App />);
  expect(screen.getByText(/Frets/i)).toBeInTheDocument();
  expect(screen.getByText(/Scale/i)).toBeInTheDocument();
});
