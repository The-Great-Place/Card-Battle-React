import { create } from 'zustand'

export const useGameStore = create((set) => ({
  screen: "mainMenu",

  setScreen: (screenName) => set({ screen: screenName }),
}))