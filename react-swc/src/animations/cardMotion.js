// src/animations/cardMotion.js

// ---------- transitions ----------
export const CARD_TRANSITION_FAST = {
  duration: 0.11,
};

export const CARD_TRANSITION_LAYOUT = {
  duration: 0.2,
};

// ---------- outer slot motion ----------
export const HAND_CARD_SLOT_IDLE = {
  y: 0,
  scale: 1,
  opacity: 1,
};

export const HAND_CARD_SLOT_SELECTED = {
  y: -16,
  scale: 1.03,
  opacity: 1,
};

export const HAND_CARD_SLOT_ENTER = {
  opacity: 0,
  y: 32,
  scale: 0.9,
};

export const HAND_CARD_SLOT_PRESENT = {
  opacity: 1,
  y: 0,
  scale: 1,
};

export const HAND_CARD_SLOT_EXIT = {
  opacity: 0,
  y: -24,
  scale: 0.88,
};

// ---------- inner button motion ----------
//export const HAND_CARD_BUTTON_HOVER = {
 // y: -4,
 // scale: 1.02,
//};

export const HAND_CARD_BUTTON_HOVER_UNSELECTED = {
  y: -8,
  scale: 1.03,
};

export const HAND_CARD_BUTTON_TAP = {
  scale: 0.90,
};

// ---------- helpers ----------
export function getHandCardSlotMotion({ isSelected }) {
  return {
    layout: true,
    initial: HAND_CARD_SLOT_ENTER,
    animate: isSelected ? HAND_CARD_SLOT_SELECTED : HAND_CARD_SLOT_IDLE,
    exit: HAND_CARD_SLOT_EXIT,
    transition: CARD_TRANSITION_LAYOUT,
  };
}

export function getHandCardButtonMotion({ isSelected, canPlay }) {
  return {
    whileHover: !canPlay
      ? {}
      : HAND_CARD_BUTTON_HOVER_UNSELECTED,
      // isSelected
       // ? HAND_CARD_BUTTON_HOVER
     //   : HAND_CARD_BUTTON_HOVER_UNSELECTED,
    whileTap: canPlay ? HAND_CARD_BUTTON_TAP : {},
    transition: CARD_TRANSITION_FAST,
  };
}