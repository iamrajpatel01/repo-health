"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Search, Bell, ChevronDown, Database, GitBranch } from 'lucide-react';

const Navbar = () => (
  <header className="h-14 flex items-center justify-between px-5 border-b border-white/5 bg-[#050B17]/90 backdrop-blur-xl sticky top-0 z-50">
    {/* Brand */}
    <div className="flex items-center gap-3">
      <div className="relative w-7 h-7">
        <div className="absolute inset-0 rounded-lg bg-[#00FF88]/20 blur-sm"></div>
        <div className="relative w-7 h-7 rounded-lg bg-[#0A1628] border border-[#00FF88]/40 flex items-center justify-center">
          <Activity className="w-4 h-4 text-[#00FF88]" />
        </div>
      </div>
      <div>
        <span className="text-sm font-bold tracking-widest text-white uppercase">Repo Health</span>
        <span className="text-sm font-bold tracking-widest text-[#00FF88] uppercase ml-1.5">Intelligence</span>
      </div>
    </div>

    {/* Center: Search */}
    <div className="flex-1 max-w-sm mx-10 relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
      <input
        type="text"
        placeholder="Search modules, commits, alerts..."
        className="w-full bg-white/4 border border-white/6 rounded-lg py-1.5 pl-9 pr-4 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-[#00A3FF]/40 focus:bg-white/6 transition-all"
      />
    </div>

    {/* Right: Controls */}
    <div className="flex items-center gap-3">
      <button className="flex items-center gap-2 text-xs text-slate-300 hover:text-white bg-white/4 border border-white/6 hover:border-white/12 rounded-lg px-3 py-1.5 transition-all">
        <Database className="w-3.5 h-3.5 text-[#00A3FF]" />
        <span className="font-mono">ihab-wp/Deviera</span>
        <ChevronDown className="w-3 h-3 opacity-40" />
      </button>
      <button className="flex items-center gap-2 text-xs text-slate-400 hover:text-white bg-white/4 border border-white/6 rounded-lg px-3 py-1.5 transition-all">
        <GitBranch className="w-3.5 h-3.5" />
        <span>Last 30 days</span>
        <ChevronDown className="w-3 h-3 opacity-40" />
      </button>
      <div className="w-px h-5 bg-white/8 mx-1"></div>
      <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
        <Bell className="w-4 h-4" />
        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#FF3B5C] rounded-full"></span>
      </button>
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00A3FF] to-[#A855F7] flex items-center justify-center text-xs font-bold text-white cursor-pointer">
        D
      </div>
    </div>
  </header>
);

export default Navbar;
