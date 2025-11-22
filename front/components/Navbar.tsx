'use client';

import { useState } from 'react';
import { ChevronDown, Beaker, ShoppingBag, Trophy, Dna, Hammer } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { EnokiConnectButton } from './EnokiConnectButton';

export function Navbar() {
    const [isLabsOpen, setIsLabsOpen] = useState(false);

    return (
        <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-full shadow-2xl px-6 py-3 flex items-center gap-6">
                <div className="flex items-center gap-6">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="relative w-8 h-8 transition-transform group-hover:scale-110 duration-300">
                            <Image src="/egg_commune.png" alt="Logo" width={32} height={32} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-gray-900 hidden sm:block font-bangers tracking-wider">
                            Evolving Eggs
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-4">
                        {/* Labs Dropdown */}
                        <div
                            className="relative group"
                            onMouseEnter={() => setIsLabsOpen(true)}
                            onMouseLeave={() => setIsLabsOpen(false)}
                        >
                            <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium transition-colors py-2 font-bangers tracking-wide">
                                <Beaker className="w-4 h-4" />
                                Labs
                                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isLabsOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            <div className={`absolute top-full left-0 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-200 origin-top-left ${isLabsOpen ? 'opacity-100 scale-100 translate-y-2' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
                                <div className="p-1">
                                    <Link href="/labs/genetics" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-bangers tracking-wide">
                                        <Dna className="w-4 h-4 text-pink-500" />
                                        Genetics
                                    </Link>
                                    <Link href="/labs/equipment" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-bangers tracking-wide">
                                        <Hammer className="w-4 h-4 text-blue-500" />
                                        Equipment
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <Link href="/market" className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium transition-colors font-bangers tracking-wide">
                            <ShoppingBag className="w-4 h-4" />
                            Market
                        </Link>

                        <Link href="/leaderboard" className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium transition-colors font-bangers tracking-wide">
                            <Trophy className="w-4 h-4" />
                            Leaderboard
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                    <div className="[&_button]:!rounded-full [&_button]:!px-6">
                        <EnokiConnectButton />
                    </div>
                </div>
            </div>
        </header>
    );
}
