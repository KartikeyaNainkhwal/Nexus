import { create } from 'zustand'

interface CommandPaletteState {
    isOpen: boolean
    query: string
    setOpen: (open: boolean) => void
    setQuery: (query: string) => void
    toggle: () => void
}

export const useCommandPalette = create<CommandPaletteState>((set) => ({
    isOpen: false,
    query: '',
    setOpen: (open) => set({ isOpen: open }),
    setQuery: (query) => set({ query }),
    toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}))
