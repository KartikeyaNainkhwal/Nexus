'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Command } from 'cmdk'
import { useRouter } from 'next/navigation'
import {
    Search,
    FolderKanban,
    CheckSquare,
    Users,
    FileText,
    Loader2,
    Zap,
    Plus,
    Moon,
    Sun,
    Clock,
    FolderPlus,
    UserPlus,
    FilePlus,
    ChevronRight,
    ArrowUpRight,
    LayoutDashboard,
    CreditCard,
    Settings2,
    CalendarDays
} from 'lucide-react'
import { useCommandPalette } from '@/store/useCommandPalette'
import { useTheme } from 'next-themes'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

const RECENT_SEARCHES_KEY = 'teamflow-recent-searches'

export function CommandPalette() {
    const { isOpen, setOpen, query, setQuery } = useCommandPalette()
    const [results, setResults] = useState<{
        projects: any[]
        tasks: any[]
        members: any[]
        documents: any[]
    } | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [recentSearches, setRecentSearches] = useState<string[]>([])
    const router = useRouter()
    const { theme, setTheme } = useTheme()

    // Load recent searches
    useEffect(() => {
        const saved = localStorage.getItem(RECENT_SEARCHES_KEY)
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved))
            } catch (e) {
                console.error('Failed to parse recent searches', e)
            }
        }
    }, [isOpen])

    const addToRecents = useCallback((term: string) => {
        if (!term || term.length < 2) return
        setRecentSearches(prev => {
            const filtered = prev.filter(s => s !== term)
            const updated = [term, ...filtered].slice(0, 5)
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
            return updated
        })
    }, [])

    const removeFromRecents = useCallback((term: string) => {
        setRecentSearches(prev => {
            const updated = prev.filter(s => s !== term)
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
            return updated
        })
    }, [])

    // Keyboard Shortcuts
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen(!isOpen)
            }
            if (e.key === 'Escape') {
                setOpen(false)
            }
        }
        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [isOpen, setOpen])

    // Search logic with debounce
    useEffect(() => {
        if (query.length < 2) {
            setResults(null)
            return
        }

        const fetchResults = async () => {
            setIsLoading(true)
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
                if (res.ok) {
                    const data = await res.json()
                    setResults(data)
                }
            } catch (error) {
                console.error('Search failed', error)
            } finally {
                setIsLoading(false)
            }
        }

        const debounce = setTimeout(fetchResults, 200)
        return () => clearTimeout(debounce)
    }, [query])

    const onSelect = useCallback((callback: () => void, termToAdd?: string) => {
        if (termToAdd) addToRecents(termToAdd)
        setOpen(false)
        setQuery('')
        callback()
    }, [setOpen, setQuery, addToRecents])

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999]">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpen(false)}
                        className="absolute inset-0 bg-black/40 backdrop-blur-[8px] dark:bg-black/60"
                    />

                    <Command.Dialog
                        open={isOpen}
                        onOpenChange={setOpen}
                        label="Global Command Palette"
                        className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[min(560px,90vw)] z-[10000]"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="bg-bg-surface border border-border shadow-2xl rounded-[20px] overflow-hidden flex flex-col max-h-[500px]"
                        >
                            <div className="flex items-center px-4 py-4 gap-3 bg-bg-surface">
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 text-accent animate-spin" />
                                ) : (
                                    <Search className="w-5 h-5 text-text-muted" />
                                )}
                                <Command.Input
                                    value={query}
                                    onValueChange={setQuery}
                                    placeholder="Search projects, tasks, people..."
                                    className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder:text-text-muted text-base font-medium"
                                    autoFocus
                                />
                                <div
                                    onClick={() => setOpen(false)}
                                    className="bg-bg-elevated border border-border rounded-lg px-2 py-1 text-[10px] font-bold text-text-muted cursor-pointer hover:text-text-primary transition-colors uppercase tracking-widest"
                                >
                                    esc
                                </div>
                            </div>

                            <div className="h-px bg-border" />

                            <Command.List className="overflow-y-auto overflow-x-hidden p-2 scrollbar-thin">
                                <Command.Empty className="py-12 flex flex-col items-center gap-4 text-center">
                                    <div className="w-12 h-12 rounded-2xl bg-bg-base flex items-center justify-center">
                                        <Search className="w-6 h-6 text-text-subtle" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-text-primary">No results for "{query}"</p>
                                        <p className="text-xs text-text-muted max-w-[200px]">Try searching for projects, tasks, or team members</p>
                                    </div>
                                </Command.Empty>

                                {!query && (
                                    <>
                                        <Command.Group heading="Quick Actions" className="mb-4">
                                            <PaletteItem
                                                onSelect={() => onSelect(() => router.push('/dashboard/projects?new=true'))}
                                                icon={FolderPlus}
                                                iconColor="text-indigo-500"
                                                label="New Project"
                                                shortcut={['N', 'P']}
                                            />
                                            <PaletteItem
                                                onSelect={() => onSelect(() => router.push('/dashboard/tasks?new=true'))}
                                                icon={Plus}
                                                iconColor="text-blue-500"
                                                label="New Task"
                                                shortcut={['N', 'T']}
                                            />
                                            <PaletteItem
                                                onSelect={() => onSelect(() => router.push('/dashboard/members?invite=true'))}
                                                icon={UserPlus}
                                                iconColor="text-emerald-500"
                                                label="Invite Member"
                                                shortcut={['N', 'I']}
                                            />
                                            <PaletteItem
                                                onSelect={() => onSelect(() => router.push('/dashboard/docs/new'))}
                                                icon={FilePlus}
                                                iconColor="text-orange-500"
                                                label="New Document"
                                                shortcut={['N', 'D']}
                                            />
                                            <PaletteItem
                                                onSelect={() => onSelect(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}
                                                icon={theme === 'dark' ? Sun : Moon}
                                                iconColor="text-amber-500"
                                                label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                                                shortcut={['T']}
                                            />
                                        </Command.Group>

                                        <Command.Group heading="Go to" className="mb-4">
                                            <PaletteItem onSelect={() => onSelect(() => router.push('/dashboard'))} icon={LayoutDashboard} label="Dashboard" rightIcon={ChevronRight} />
                                            <PaletteItem onSelect={() => onSelect(() => router.push('/dashboard/projects'))} icon={FolderKanban} label="Projects" rightIcon={ChevronRight} />
                                            <PaletteItem onSelect={() => onSelect(() => router.push('/dashboard/tasks'))} icon={CheckSquare} label="Tasks" rightIcon={ChevronRight} />
                                            <PaletteItem onSelect={() => onSelect(() => router.push('/dashboard/members'))} icon={Users} label="Members" rightIcon={ChevronRight} />
                                            <PaletteItem onSelect={() => onSelect(() => router.push('/dashboard/calendar'))} icon={CalendarDays} label="Calendar" rightIcon={ChevronRight} />
                                            <PaletteItem onSelect={() => onSelect(() => router.push('/dashboard/billing'))} icon={CreditCard} label="Billing" rightIcon={ChevronRight} />
                                            <PaletteItem onSelect={() => onSelect(() => router.push('/dashboard/settings'))} icon={Settings2} label="Settings" rightIcon={ChevronRight} />
                                        </Command.Group>

                                        {recentSearches.length > 0 && (
                                            <Command.Group heading="Recent">
                                                {recentSearches.map(term => (
                                                    <div key={term} className="group relative">
                                                        <PaletteItem
                                                            onSelect={() => setQuery(term)}
                                                            icon={HistoryItemIcon}
                                                            label={term}
                                                        />
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                removeFromRecents(term)
                                                            }}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md bg-bg-base/50 text-text-muted opacity-0 group-hover:opacity-100 transition-all hover:text-danger hover:bg-danger/10"
                                                        >
                                                            <Plus className="w-3.5 h-3.5 rotate-45" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </Command.Group>
                                        )}
                                    </>
                                )}

                                {query.length >= 2 && results && (
                                    <>
                                        {results.projects.length > 0 && (
                                            <Command.Group heading={`Projects • ${results.projects.length}`} className="mb-4">
                                                {results.projects.map(p => (
                                                    <PaletteItem
                                                        key={p.id}
                                                        onSelect={() => onSelect(() => router.push(`/dashboard/projects/${p.id}`), query)}
                                                        icon={() => <span className="text-base">{p.emoji || '📁'}</span>}
                                                        label={p.name}
                                                        sublabel={`${p.taskCount || 0} tasks`}
                                                        rightIcon={ArrowUpRight}
                                                    />
                                                ))}
                                            </Command.Group>
                                        )}

                                        {results.tasks.length > 0 && (
                                            <Command.Group heading={`Tasks • ${results.tasks.length}`} className="mb-4">
                                                {results.tasks.map(t => (
                                                    <PaletteItem
                                                        key={t.id}
                                                        onSelect={() => onSelect(() => router.push(`/dashboard/projects/${t.projectId}?task=${t.id}`), query)}
                                                        icon={() => <PriorityDot priority={t.priority} />}
                                                        label={t.title}
                                                        sublabel={t.project?.name}
                                                        badge={t.status}
                                                    />
                                                ))}
                                            </Command.Group>
                                        )}

                                        {results.members.length > 0 && (
                                            <Command.Group heading={`People • ${results.members.length}`} className="mb-4">
                                                {results.members.map(m => (
                                                    <PaletteItem
                                                        key={m.id}
                                                        onSelect={() => onSelect(() => router.push('/dashboard/members'), query)}
                                                        icon={() => (
                                                            <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold text-white uppercase">
                                                                {m.name?.substring(0, 2) || '??'}
                                                            </div>
                                                        )}
                                                        label={m.name}
                                                        badge={m.role}
                                                        rightIcon={ChevronRight}
                                                    />
                                                ))}
                                            </Command.Group>
                                        )}

                                        {results.documents.length > 0 && (
                                            <Command.Group heading={`Documents • ${results.documents.length}`}>
                                                {results.documents.map(d => (
                                                    <PaletteItem
                                                        key={d.id}
                                                        onSelect={() => onSelect(() => router.push(`/dashboard/docs/${d.id}`), query)}
                                                        icon={() => <span className="text-base">{d.emoji || '📄'}</span>}
                                                        label={d.title || 'Untitled'}
                                                        sublabel={`Edited ${formatDistanceToNow(new Date(d.updatedAt))} ago`}
                                                        rightIcon={ArrowUpRight}
                                                    />
                                                ))}
                                            </Command.Group>
                                        )}
                                    </>
                                )}
                            </Command.List>

                            <div className="bg-bg-elevated/50 border-t border-border px-4 py-3 flex items-center gap-6">
                                <Hint kbd="↑↓" label="Navigate" />
                                <Hint kbd="↵" label="Select" />
                                <Hint kbd="esc" label="Close" />
                                <div className="ml-auto flex items-center gap-1.5 text-[10px] font-bold text-accent uppercase tracking-widest">
                                    <Zap className="w-3 h-3" />
                                    TeamFlow Intel
                                </div>
                            </div>
                        </motion.div>
                    </Command.Dialog>
                </div>
            )}
        </AnimatePresence>
    )
}

function PaletteItem({ icon: Icon, iconColor, label, sublabel, onSelect, shortcut, rightIcon: RightIcon, badge }: any) {
    return (
        <Command.Item
            onSelect={onSelect}
            className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] cursor-pointer aria-selected:bg-accent-light dark:aria-selected:bg-accent/10 transition-all group"
        >
            <div className={cn(
                "w-9 h-9 flex items-center justify-center rounded-xl bg-bg-base group-aria-selected:bg-bg-surface transition-colors",
                iconColor
            )}>
                {typeof Icon === 'function' ? <Icon /> : <Icon className="w-5 h-5" />}
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                <span className="text-sm font-semibold text-text-primary truncate">
                    {label}
                </span>
                {sublabel && (
                    <span className="text-[11px] text-text-muted truncate">
                        {sublabel}
                    </span>
                )}
            </div>

            {badge && (
                <span className="px-2 py-0.5 rounded-md bg-bg-base text-[10px] font-black text-text-muted uppercase tracking-tighter group-aria-selected:bg-accent/10 group-aria-selected:text-accent transition-colors">
                    {badge}
                </span>
            )}

            {shortcut && (
                <div className="flex items-center gap-1">
                    {shortcut.map((key: string) => (
                        <kbd key={key} className="bg-bg-elevated border border-border rounded-md px-1.5 py-0.5 text-[10px] font-mono text-text-muted">
                            {key}
                        </kbd>
                    ))}
                </div>
            )}

            {RightIcon && (
                <RightIcon className="w-4 h-4 text-text-subtle group-aria-selected:text-accent transition-colors" />
            )}
        </Command.Item>
    )
}

function Hint({ kbd, label }: { kbd: string, label: string }) {
    return (
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-subtle uppercase tracking-tight">
            <kbd className="bg-bg-surface border border-border rounded-md px-1.5 py-0.5 text-text-muted shadow-sm">
                {kbd}
            </kbd>
            <span>{label}</span>
        </div>
    )
}

function PriorityDot({ priority }: { priority: string }) {
    const colors: any = {
        HIGH: 'bg-danger',
        MEDIUM: 'bg-warning',
        LOW: 'bg-success'
    }
    return <div className={cn("w-2 h-2 rounded-full", colors[priority] || 'bg-text-subtle')} />
}

function HistoryItemIcon() {
    return <Clock className="w-4 h-4 text-text-subtle" />
}
