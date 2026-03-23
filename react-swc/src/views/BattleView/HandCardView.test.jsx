import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HandCardView } from "./HandCardView.jsx";

describe("HandCardView", () => {
  it("shows the selected style for the selected card instance", () => {
    const card = {
      instanceId: "card-1",
      name: "Strike",
      image: "/strike.png",
      description: "Deal 6 damage",
      getCurrentCost: () => 1,
    };

    const player = {
      energy: 3,
      costReduction: [],
      deck: { hand: [card] },
    };

    render(
      <HandCardView
        onPress={vi.fn()}
        player={player}
        card={card}
        card_idx={0}
        selectedCard={{ card, instanceId: "card-1" }}
      />
    );

    expect(screen.getByRole("button")).toHaveClass("selectedCard");
    expect(screen.getByText("Strike")).toBeInTheDocument();
  });

  it("disables the button when the player cannot afford the card", () => {
    const card = {
      instanceId: "card-2",
      name: "Fireball",
      image: "/fireball.png",
      description: "Deal 10 damage",
      getCurrentCost: () => 3,
    };

    const player = {
      energy: 1,
      costReduction: [],
      deck: { hand: [card] },
    };

    render(
      <HandCardView
        onPress={vi.fn()}
        player={player}
        card={card}
        card_idx={0}
        selectedCard={{ card: null, instanceId: null }}
      />
    );

    expect(screen.getByRole("button")).toHaveClass("card--disabled");
  });
});
