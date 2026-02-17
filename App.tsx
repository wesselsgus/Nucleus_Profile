
// Add React import to fix namespace errors for React.FC and React.FormEvent
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MenuState, TerminalLine, Host } from './types';
import { NUCLEUS_HOSTS, SERVER_TOOLS, WEB_TOOLS } from './constants';
import { simulateTroubleshooting, simulateServerScan, simulateWebScan } from './services/gemini';

type NucleusUser = 'admin' | 'gustavw' | 'stephenc';

const App: React.FC = () => {
  const [menuState, setMenuState] = useState<MenuState>(MenuState.MAIN);
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [webUrl, setWebUrl] = useState('');
  const [commandInput, setCommandInput] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['af-south-1', 'Vulnerability']));
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Identity State
  const [currentUser, setCurrentUser] = useState<NucleusUser>(() => {
    const saved = localStorage.getItem('nucleus_user');
    return (saved as NucleusUser) || 'admin';
  });

  // Host State with Persistence
  const [hosts, setHosts] = useState<Host[]>(() => {
    const saved = localStorage.getItem('nucleus_hosts');
    return saved ? JSON.parse(saved) : NUCLEUS_HOSTS;
  });

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('nucleus_hosts', JSON.stringify(hosts));
  }, [hosts]);

  useEffect(() => {
    localStorage.setItem('nucleus_user', currentUser);
  }, [currentUser]);

  const addLine = useCallback((text: string, type: TerminalLine['type'] = 'info') => {
    setLines(prev => [...prev, {
      text,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour12: false })
    }]);
  }, []);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  // Initial Boot Sequence
  useEffect(() => {
    if (!isLoggedIn) return;
    setLines([]); 
    addLine(`SESSION ESTABLISHED: ${currentUser.toUpperCase()}@NUCLEUS.T6F.CO.ZA`, "success");
    addLine(`SYSTEM INITIALIZED. OPS CONSOLE v2.7.4_AFRICA`, "info");
    addLine("Type 'help' for available commands or use tactical menu.");
    inputRef.current?.focus();
  }, [addLine, currentUser, isLoggedIn]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAction = async (action: () => Promise<void>) => {
    setIsProcessing(true);
    try {
      await action();
    } catch (error) {
      addLine(`CRITICAL ERROR: ${error}`, 'error');
    } finally {
      setIsProcessing(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const switchUser = (user: NucleusUser) => {
    if (user === currentUser) return;
    setCurrentUser(user);
    setShowUserMenu(false);
    setIsLoggedIn(false); // Force re-login sequence
  };

  const handleLogin = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsLoggedIn(true);
      setIsConnecting(false);
    }, 1500);
  };

  const runTroubleshooting = (host: Host, command: string) => {
    handleAction(async () => {
      addLine(`$ ssh ${currentUser}@${host.ip} "${command}"`, 'command');
      const result = await simulateTroubleshooting(host.name, command);
      result.split('\n').forEach(line => addLine(line, 'output'));
    });
  };

  const runFullScan = (host: Host, tool: string) => {
    setMenuState(MenuState.EXECUTING);
    handleAction(async () => {
      addLine(`$ nucleus-cli scan --node ${host.id} --tactical-tool "${tool}"`, 'command');
      addLine(`Initiating remote telemetry on ${host.ip}...`, 'info');
      const result = await simulateServerScan(`${host.name} via ${tool}`);
      const chunks = result.split('\n');
      for (const chunk of chunks) {
        addLine(chunk, 'output');
        await new Promise(r => setTimeout(r, 80));
      }
      addLine(`Analysis complete. Report cached in local registry.`, 'success');
      setMenuState(MenuState.MAIN);
    });
  };

  const runWebScan = (url: string, tool: string) => {
    if (!url) {
      addLine("ERROR: TARGET URL NOT SPECIFIED", "error");
      return;
    }
    setMenuState(MenuState.EXECUTING);
    handleAction(async () => {
      addLine(`$ ${tool.toLowerCase().replace(/[\s\(\)]/g, '_')} --target ${url} --operator ${currentUser}`, 'command');
      const result = await simulateWebScan(url, tool);
      result.split('\n').forEach(line => addLine(line, 'output'));
      setMenuState(MenuState.MAIN);
    });
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = commandInput.trim().toLowerCase();
    if (!cmd) return;

    addLine(`[${currentUser}@nucleus ~]$ ${commandInput}`, 'command');
    setCommandInput('');

    const parts = cmd.split(' ');
    const base = parts[0];
    const arg1 = parts[1];

    switch (base) {
      case 'whoami':
        addLine(currentUser, "success");
        break;
      case 'clear':
        setLines([]);
        break;
      case 'help':
        addLine("AVAILABLE COMMANDS:", "success");
        addLine("  whoami         - Current operator identity");
        addLine("  ls             - List regional node registry");
        addLine("  clear          - Flush console buffer");
        addLine("  ping [host]    - ICMP echo to node");
        addLine("  scan [host]    - Execute server security audit");
        addLine("  menu [state]   - Jump to [main|jump|scan|web|config]");
        break;
      case 'ls':
        addLine("INFRASTRUCTURE REGISTRY (ACTIVE):", "success");
        hosts.forEach(h => addLine(`  ${h.name.padEnd(25)} ${h.ip.padEnd(15)} [${h.status}]`));
        break;
      case 'menu':
        const target = arg1?.toUpperCase() as keyof typeof MenuState;
        if (MenuState[target]) setMenuState(MenuState[target]);
        else addLine("Usage: menu [main|jump|scan|web|config]", "error");
        break;
      default:
        const host = hosts.find(h => h.name === arg1 || h.ip === arg1);
        if (host && ['ping', 'scan'].includes(base)) {
           if (base === 'scan') runFullScan(host, "Standard Audit");
           else runTroubleshooting(host, 'ping -c 4 8.8.8.8');
        } else {
           addLine(`Command unrecognized. Reference 'help' for tactical usage.`, "error");
        }
    }
  };

  const hostsByRegion = useMemo(() => {
    return hosts.reduce((acc, host) => {
      if (!acc[host.region]) acc[host.region] = [];
      acc[host.region].push(host);
      return acc;
    }, {} as Record<string, Host[]>);
  }, [hosts]);

  const renderLogin = () => (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full border border-green-500 bg-black p-8 shadow-[0_0_50px_rgba(0,255,65,0.15)] font-mono">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black tracking-tighter text-green-500 uppercase mb-2">NUCLEUS AUTH</h2>
          <div className="text-[10px] text-green-800 uppercase tracking-widest border-y border-green-900 py-1">Secure Operations Portal</div>
        </div>
        
        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-green-700 uppercase">Gateway Node</span>
            <div className="text-sm border border-green-900 p-2 bg-green-950/10 text-blue-400">nucleus.t6f.co.za</div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-green-700 uppercase">Active Identity</span>
            <select 
              value={currentUser}
              onChange={(e) => setCurrentUser(e.target.value as NucleusUser)}
              className="text-sm border border-green-900 p-2 bg-black text-green-400 w-full focus:outline-none focus:border-green-500 appearance-none cursor-pointer uppercase font-bold"
            >
              <option value="admin">admin</option>
              <option value="gustavw">gustavw</option>
              <option value="stephenc">stephenc</option>
            </select>
          </div>
          
          <button 
            disabled={isConnecting}
            onClick={handleLogin}
            className="w-full py-4 border border-green-500 hover:bg-green-500 hover:text-black transition-all font-black text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-wait relative overflow-hidden group"
          >
            {isConnecting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Negotiating Handshake...
              </span>
            ) : (
              <span>[ INITIALIZE SESSION ]</span>
            )}
            <div className="absolute inset-0 bg-green-500/10 group-hover:bg-transparent transition-colors" />
          </button>
          
          <div className="text-[8px] text-green-900 leading-relaxed text-center opacity-60">
            SYSTEM UNDER CONTINUOUS MONITORING. PROPRIETARY FIRMWARE DETECTED.
            <br />LOGOUT PREVIOUS SESSIONS BEFORE ENTRY.
          </div>
        </div>
      </div>
    </div>
  );

  const renderMainMenu = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-green-900 bg-black/40">
      <button onClick={() => setMenuState(MenuState.JUMPHOSTS)} className="p-6 border border-green-500 hover:bg-green-500 hover:text-black transition-all flex flex-col items-center group relative h-36 justify-center text-center">
        <span className="text-2xl font-black mb-1">[ 1 ]</span>
        <span className="font-bold tracking-widest text-xs uppercase">JUMPHOSTS</span>
        <div className="absolute bottom-2 right-2 text-[8px] opacity-30 font-mono">REGISTRY_HUD</div>
      </button>
      <button onClick={() => setMenuState(MenuState.SERVER_SCAN)} className="p-6 border border-green-500 hover:bg-green-500 hover:text-black transition-all flex flex-col items-center group relative h-36 justify-center text-center">
        <span className="text-2xl font-black mb-1">[ 2 ]</span>
        <span className="font-bold tracking-widest text-xs uppercase">SERVER SCAN</span>
        <div className="absolute bottom-2 right-2 text-[8px] opacity-30 font-mono">SECURITY_AUDIT</div>
      </button>
      <button onClick={() => setMenuState(MenuState.WEB_SCAN)} className="p-6 border border-green-500 hover:bg-green-500 hover:text-black transition-all flex flex-col items-center group relative h-36 justify-center text-center">
        <span className="text-2xl font-black mb-1">[ 3 ]</span>
        <span className="font-bold tracking-widest text-xs uppercase">WEB VULN</span>
        <div className="absolute bottom-2 right-2 text-[8px] opacity-30 font-mono">OWASP_TASTICAL</div>
      </button>
    </div>
  );

  const renderJumphostsMenu = () => (
    <div className="flex flex-col gap-4 p-4 border border-green-900 bg-black/60">
      <div className="flex justify-between items-center border-b border-green-800 pb-2">
        <h2 className="text-xl font-bold uppercase tracking-widest">Global Node Registry</h2>
        <button onClick={() => setMenuState(MenuState.MAIN)} className="text-xs hover:underline text-green-700 hover:text-green-400 font-mono">[ BACK ]</button>
      </div>
      <div className="space-y-4 overflow-y-auto max-h-[48vh] pr-2">
        {(Object.entries(hostsByRegion) as [string, Host[]][]).map(([region, regionHosts]) => (
          <div key={region} className="border border-green-900/50">
            <button onClick={() => toggleSection(region)} className="w-full flex justify-between items-center p-2 bg-green-900/10 hover:bg-green-900/20 transition-colors font-mono text-xs uppercase tracking-wider border-b border-green-900/50">
              <span className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                {region} <span className="text-green-800">[{regionHosts.length} NODES]</span>
              </span>
              <span className="font-bold">{expandedSections.has(region) ? '[ - ]' : '[ + ]'}</span>
            </button>
            {expandedSections.has(region) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 p-2 animate-in fade-in slide-in-from-top-1 duration-200">
                {regionHosts.map(host => (
                  <div key={host.id} className="relative overflow-hidden border border-green-800 p-3 cursor-pointer group hover:border-green-400 h-16 flex flex-col justify-center bg-black/40">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${host.status === 'online' ? 'bg-green-500 shadow-[0_0_6px_#22c55e]' : 'bg-red-500 shadow-[0_0_6px_#ef4444]'}`} />
                      <span className="text-[10px] font-bold tracking-tight truncate uppercase leading-none">{host.name}</span>
                    </div>
                    
                    {/* ENHANCED HOVER HUD */}
                    <div className="absolute inset-0 bg-black/95 translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out p-2 flex flex-col justify-between border-t border-green-400 z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.8)]">
                      <div className="flex flex-col leading-tight">
                        <div className="flex justify-between items-center border-b border-green-900/50 pb-0.5 mb-1">
                          <span className="text-[7px] text-green-700 font-mono uppercase">Region</span>
                          <span className="text-[8px] text-blue-400 font-mono uppercase">{host.region}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[7px] text-green-700 font-mono uppercase">Internal IP</span>
                          <span className="text-[9px] text-green-500 font-mono">{host.ip}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); runTroubleshooting(host, 'ping -c 4 8.8.8.8'); }} className="flex-grow py-0.5 text-[8px] border border-green-600 hover:bg-green-500 hover:text-black transition-colors uppercase font-bold font-mono">ping</button>
                        <button onClick={(e) => { e.stopPropagation(); runTroubleshooting(host, 'df -h'); }} className="flex-grow py-0.5 text-[8px] border border-green-600 hover:bg-green-500 hover:text-black transition-colors uppercase font-bold font-mono">disk</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderServerScanMenu = () => (
    <div className="flex flex-col gap-4 p-4 border border-green-900 bg-black/60">
      <div className="flex justify-between items-center border-b border-green-800 pb-2">
        <h2 className="text-xl font-bold uppercase tracking-widest text-green-400">Tactical Server Audits</h2>
        <button onClick={() => setMenuState(MenuState.MAIN)} className="text-xs hover:underline text-green-700 hover:text-green-400 font-mono">[ BACK ]</button>
      </div>
      <div className="space-y-4 overflow-y-auto max-h-[45vh] pr-2">
        {(Object.entries(hostsByRegion) as [string, Host[]][]).map(([region, regionHosts]) => (
          <div key={region} className="border border-green-900/50">
            <button onClick={() => toggleSection(`scan-${region}`)} className="w-full flex justify-between items-center p-2 bg-green-900/10 hover:bg-green-900/20 transition-colors font-mono text-xs uppercase tracking-wider border-b border-green-900/50">
              <span>{region} DEPLOYMENT ZONE</span>
              <span className="font-bold">{expandedSections.has(`scan-${region}`) ? '[ - ]' : '[ + ]'}</span>
            </button>
            {expandedSections.has(`scan-${region}`) && (
              <div className="p-3 animate-in fade-in slide-in-from-top-1 duration-200 space-y-4">
                {regionHosts.map(host => (
                  <div key={host.id} className="flex flex-col gap-2 border-b border-green-900/30 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-black uppercase text-green-400">{host.name} <span className="text-green-800 ml-2">({host.ip})</span></div>
                      <div className="text-[8px] font-mono text-green-900 uppercase">Ready for Injection</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {SERVER_TOOLS.map(tool => (
                        <button key={tool} onClick={() => runFullScan(host, tool)} className="px-2 py-1 border border-green-700 hover:border-green-500 hover:text-black text-[9px] font-mono uppercase transition-all bg-green-950/10">
                          {tool}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderWebScanMenu = () => (
    <div className="flex flex-col gap-4 p-4 border border-green-900 bg-black/60">
      <div className="flex justify-between items-center border-b border-green-800 pb-2">
        <h2 className="text-xl font-bold uppercase tracking-widest text-blue-500">OWASP Tactical Analysis</h2>
        <button onClick={() => setMenuState(MenuState.MAIN)} className="text-xs hover:underline text-green-700 hover:text-green-400 font-mono">[ BACK ]</button>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-green-700 uppercase ml-1">Analysis Target</span>
        <input 
          type="text" value={webUrl} onChange={(e) => setWebUrl(e.target.value)} placeholder="https://target-endpoint.internal"
          className="bg-black border border-green-500 text-green-500 px-4 py-2 focus:outline-none placeholder:text-green-900 font-mono mb-4 shadow-[inset_0_0_10px_rgba(0,255,65,0.05)]"
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 overflow-y-auto max-h-[40vh] pr-2">
        {WEB_TOOLS.map(tool => (
          <button key={tool} onClick={() => runWebScan(webUrl, tool)} className="p-3 border border-green-700 hover:border-green-400 hover:bg-green-500 hover:text-black text-[9px] font-mono uppercase text-center flex flex-col items-center justify-center min-h-[70px] transition-all bg-green-950/5">
            {tool}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col p-4 md:p-8 max-w-7xl mx-auto overflow-hidden bg-[#050505] text-[#00ff41]">
      {!isLoggedIn && renderLogin()}
      
      <header className="flex justify-between items-start mb-4 border-b border-green-500 pb-2 relative">
        <div className="flex items-start gap-4">
          <div className="relative group">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex flex-col items-center justify-center w-12 h-12 border border-green-500 bg-black/50 hover:bg-green-500/10 transition-colors"
            >
              <span className="text-[8px] font-bold text-green-400 mb-1">USER</span>
              <div className="w-4 h-4 bg-green-500/20 border border-green-500 flex items-center justify-center">
                <div className={`w-1.5 h-1.5 ${currentUser === 'admin' ? 'bg-red-500' : currentUser === 'gustavw' ? 'bg-blue-400' : 'bg-orange-500'} animate-pulse`} />
              </div>
            </button>
            {showUserMenu && (
              <div className="absolute top-14 left-0 w-32 bg-black border border-green-500 z-50 animate-in fade-in zoom-in-95 duration-100 shadow-[0_0_15px_rgba(0,255,65,0.2)]">
                {(['admin', 'gustavw', 'stephenc'] as NucleusUser[]).map(user => (
                  <button key={user} onClick={() => switchUser(user)} className={`w-full text-left p-2 text-[10px] font-mono uppercase hover:bg-green-500 hover:text-black transition-colors ${currentUser === user ? 'bg-green-900/30' : ''}`}>
                    [ {user} ]
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase">{currentUser}_OPS@NUCLEUS</h1>
            <p className="text-[10px] text-green-600 uppercase tracking-widest">nucleus.t6f.co.za // SESSION_OK</p>
          </div>
        </div>
        
        <div className="text-right text-[10px] font-mono flex flex-col items-end gap-1">
          <div className="flex gap-2">
            <button 
              onClick={() => setMenuState(MenuState.CONFIG)}
              className="text-yellow-600 hover:text-yellow-400 border border-yellow-900 px-2 py-0.5 transition-colors uppercase"
            >
              [ REGISTRY_EDIT ]
            </button>
            <span className="text-white bg-green-950 border border-green-500 px-1 font-bold">LIVE_UPLINK</span>
          </div>
          <div className="opacity-40 uppercase">NODES: {hosts.length} // STABLE_CHANNEL // {new Date().getFullYear()}</div>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto mb-4 border border-green-900/30 bg-black/40 p-4 flex flex-col relative shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
        <div className="space-y-1 flex-grow">
          {lines.map((line, i) => (
            <div key={i} className="flex gap-3 leading-tight animate-in fade-in slide-in-from-left-2 duration-300 font-mono">
              <span className="opacity-30 text-[9px] whitespace-nowrap pt-1">[{line.timestamp}]</span>
              <span className={`break-words text-sm ${line.type === 'error' ? 'text-red-500' : line.type === 'success' ? 'text-blue-400' : line.type === 'command' ? 'text-yellow-400 font-bold' : line.type === 'output' ? 'text-gray-400' : 'text-green-500'}`}>
                {line.type === 'command' && <span className="mr-1">➜</span>}
                {line.text}
              </span>
            </div>
          ))}
          {isProcessing && <div className="flex gap-2 items-center text-green-400 animate-pulse mt-2 font-mono"><span className="text-[10px]">EXECUTING_PAYLOAD...</span><div className="w-1.5 h-4 bg-green-500 animate-bounce" /></div>}
          <div ref={terminalEndRef} />
        </div>
        <div className="mt-4 border-t border-green-900/50 pt-3 flex items-center gap-2 font-mono">
          <span className="text-green-500 font-bold shrink-0">[{currentUser}@nucleus ~]$</span>
          <form onSubmit={handleCommandSubmit} className="flex-grow">
            <input ref={inputRef} type="text" value={commandInput} onChange={(e) => setCommandInput(e.target.value)} className="bg-transparent border-none text-green-400 focus:outline-none w-full caret-green-500 text-sm" autoComplete="off" spellCheck="false" autoFocus />
          </form>
        </div>
      </main>

      <section className="mt-auto">
        {menuState === MenuState.MAIN && renderMainMenu()}
        {menuState === MenuState.JUMPHOSTS && renderJumphostsMenu()}
        {menuState === MenuState.SERVER_SCAN && renderServerScanMenu()}
        {menuState === MenuState.WEB_SCAN && renderWebScanMenu()}
        {menuState === MenuState.EXECUTING && (
          <div className="p-10 border border-green-500 bg-black flex flex-col items-center justify-center gap-4 shadow-[0_0_30px_rgba(0,255,65,0.1)]">
             <div className="relative">
                <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                </div>
             </div>
             <div className="text-xl font-black tracking-[0.2em] animate-pulse uppercase font-mono text-green-500">Injecting Tactical Payload...</div>
             <div className="text-[9px] text-green-900 font-mono">ENCRYPTING UPLINK // BYPASSING LOCAL FIREWALLS</div>
          </div>
        )}
      </section>
    </div>
  );
};

export default App;
