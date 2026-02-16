
// Add React import to fix namespace errors for React.FC and React.FormEvent
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MenuState, TerminalLine, Host } from './types';
import { NUCLEUS_HOSTS, OWASP_TOOLS } from './constants';
import { simulateTroubleshooting, simulateServerScan, simulateWebScan } from './services/gemini';

type NucleusUser = 'admin' | 'gustavw' | 'stephenc';

const App: React.FC = () => {
  const [menuState, setMenuState] = useState<MenuState>(MenuState.MAIN);
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [webUrl, setWebUrl] = useState('');
  const [commandInput, setCommandInput] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['us-east-1', 'Vulnerability']));
  const [showUserMenu, setShowUserMenu] = useState(false);
  
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

  useEffect(() => {
    setLines([]); // Clear on boot/switch for clean feel
    addLine(`SYSTEM INITIALIZED. NUCLEUS OPS CONSOLE v2.5.0`, "success");
    addLine(`AUTHENTICATED AS: ${currentUser.toUpperCase()}`, "info");
    addLine("Type 'help' for available commands or use the menu below.");
    inputRef.current?.focus();
  }, [addLine, currentUser]);

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
    addLine(`LOGOUT: Session ended for ${currentUser}`, 'error');
    setCurrentUser(user);
    setShowUserMenu(false);
    addLine(`LOGIN: Initializing secure context for ${user}...`, 'success');
  };

  // Host Management Functions
  const addHost = () => {
    const newHost: Host = {
      id: `h-${Date.now()}`,
      name: 'new-host',
      ip: '0.0.0.0',
      status: 'online',
      region: 'us-east-1'
    };
    setHosts([...hosts, newHost]);
    addLine(`SYSTEM: New node ${newHost.id} added to registry.`, 'success');
  };

  const updateHost = (id: string, updates: Partial<Host>) => {
    setHosts(hosts.map(h => h.id === id ? { ...h, ...updates } : h));
  };

  const removeHost = (id: string) => {
    setHosts(hosts.filter(h => h.id !== id));
    addLine(`SYSTEM: Node ${id} decommissioned from registry.`, 'error');
  };

  const runTroubleshooting = (host: Host, command: string) => {
    handleAction(async () => {
      addLine(`$ ssh ${currentUser}@${host.ip} "${command}"`, 'command');
      const result = await simulateTroubleshooting(host.name, command);
      result.split('\n').forEach(line => addLine(line, 'output'));
    });
  };

  const runFullScan = (host: Host) => {
    setMenuState(MenuState.EXECUTING);
    handleAction(async () => {
      addLine(`$ curl -sSL https://nucleus.internal/scripts/scan.sh | bash -s -- --user ${currentUser} --host ${host.name}`, 'command');
      addLine(`Establishing encrypted tunnel to ${host.ip}...`, 'info');
      const result = await simulateServerScan(host.name);
      const chunks = result.split('\n');
      for (const chunk of chunks) {
        addLine(chunk, 'output');
        await new Promise(r => setTimeout(r, 100));
      }
      addLine(`Scan script /tmp/nucleus_scan_${host.id}.sh removed successfully.`, 'success');
      addLine(`Connection to ${host.name} closed.`, 'info');
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
      addLine(`$ ${tool.toLowerCase().replace(' ', '_')} --target ${url} --operator ${currentUser}`, 'command');
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
      case 'help':
        addLine("AVAILABLE COMMANDS:", "success");
        addLine("  whoami         - Show current active user");
        addLine("  ls             - List all hosts");
        addLine("  ping [host]    - Ping a specific host");
        addLine("  disk [host]    - Check disk usage on host");
        addLine("  scan [host]    - Run full security scan on host");
        addLine("  menu [main|jump|scan|web|config] - Switch menu view");
        break;
      case 'ls':
        addLine("HOST REGISTRY:", "success");
        hosts.forEach(h => addLine(`  ${h.name.padEnd(20)} ${h.ip.padEnd(15)} [${h.status}]`));
        break;
      case 'menu':
        const target = arg1?.toUpperCase() as keyof typeof MenuState;
        if (MenuState[target]) setMenuState(MenuState[target]);
        else addLine("Usage: menu [main|jump|scan|web|config]", "error");
        break;
      default:
        const host = hosts.find(h => h.name === arg1 || h.ip === arg1);
        if (host && ['ping', 'disk', 'scan'].includes(base)) {
           if (base === 'scan') runFullScan(host);
           else runTroubleshooting(host, base === 'ping' ? 'ping -c 4 8.8.8.8' : 'df -h');
        } else {
           addLine(`Command not recognized or host not found.`, "error");
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

  const renderMainMenu = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-green-900 bg-black/40">
      <button onClick={() => setMenuState(MenuState.JUMPHOSTS)} className="p-6 border border-green-500 hover:bg-green-500 hover:text-black transition-all flex flex-col items-center group relative h-36 justify-center">
        <span className="text-2xl font-black mb-1">[ 1 ]</span>
        <span className="font-bold tracking-widest text-xs uppercase">JUMPHOSTS</span>
      </button>
      <button onClick={() => setMenuState(MenuState.SERVER_SCAN)} className="p-6 border border-green-500 hover:bg-green-500 hover:text-black transition-all flex flex-col items-center group relative h-36 justify-center">
        <span className="text-2xl font-black mb-1">[ 2 ]</span>
        <span className="font-bold tracking-widest text-xs uppercase">SERVER SCAN</span>
      </button>
      <button onClick={() => setMenuState(MenuState.WEB_SCAN)} className="p-6 border border-green-500 hover:bg-green-500 hover:text-black transition-all flex flex-col items-center group relative h-36 justify-center">
        <span className="text-2xl font-black mb-1">[ 3 ]</span>
        <span className="font-bold tracking-widest text-xs uppercase">WEB VULN</span>
      </button>
    </div>
  );

  const renderConfigMenu = () => (
    <div className="flex flex-col gap-4 p-4 border border-green-900 bg-black/60">
      <div className="flex justify-between items-center border-b border-green-800 pb-2">
        <h2 className="text-xl font-bold uppercase tracking-widest text-yellow-500">Infrastructure Config Vault</h2>
        <button onClick={() => setMenuState(MenuState.MAIN)} className="text-xs hover:underline text-green-700 hover:text-green-400 font-mono">[ BACK ]</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-green-900 text-green-800 uppercase">
              <th className="p-2">Name</th>
              <th className="p-2">IP Address</th>
              <th className="p-2">Region</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {hosts.map(host => (
              <tr key={host.id} className="border-b border-green-900/30 hover:bg-green-900/10">
                <td className="p-2">
                  <input 
                    value={host.name} 
                    onChange={e => updateHost(host.id, { name: e.target.value })}
                    className="bg-transparent border-b border-transparent focus:border-green-500 focus:outline-none w-full"
                  />
                </td>
                <td className="p-2">
                  <input 
                    value={host.ip} 
                    onChange={e => updateHost(host.id, { ip: e.target.value })}
                    className="bg-transparent border-b border-transparent focus:border-green-500 focus:outline-none w-full"
                  />
                </td>
                <td className="p-2">
                  <select 
                    value={host.region} 
                    onChange={e => updateHost(host.id, { region: e.target.value })}
                    className="bg-black border border-green-900 focus:outline-none"
                  >
                    <option value="us-east-1">us-east-1</option>
                    <option value="us-west-2">us-west-2</option>
                    <option value="eu-west-1">eu-west-1</option>
                    <option value="af-south-1">af-south-1 (South Africa)</option>
                  </select>
                </td>
                <td className="p-2">
                  <button 
                    onClick={() => updateHost(host.id, { status: host.status === 'online' ? 'offline' : 'online' })}
                    className={`px-2 py-0.5 border ${host.status === 'online' ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}
                  >
                    {host.status.toUpperCase()}
                  </button>
                </td>
                <td className="p-2">
                  <button onClick={() => removeHost(host.id)} className="text-red-700 hover:text-red-400 font-bold">[ DELETE ]</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addHost} className="w-full py-2 border border-dashed border-green-700 hover:border-green-400 text-green-700 hover:text-green-400 font-mono text-xs uppercase mt-2">
        + Add New Infrastructure Node
      </button>
    </div>
  );

  const renderJumphostsMenu = () => (
    <div className="flex flex-col gap-4 p-4 border border-green-900 bg-black/60">
      <div className="flex justify-between items-center border-b border-green-800 pb-2">
        <h2 className="text-xl font-bold uppercase tracking-widest">Select Target Host</h2>
        <button onClick={() => setMenuState(MenuState.MAIN)} className="text-xs hover:underline text-green-700 hover:text-green-400 font-mono">[ BACK ]</button>
      </div>
      <div className="space-y-4 overflow-y-auto max-h-[40vh] pr-2">
        {(Object.entries(hostsByRegion) as [string, Host[]][]).map(([region, regionHosts]) => (
          <div key={region} className="border border-green-900/50">
            <button onClick={() => toggleSection(region)} className="w-full flex justify-between items-center p-2 bg-green-900/10 hover:bg-green-900/20 transition-colors font-mono text-xs uppercase tracking-wider border-b border-green-900/50">
              <span>{region} ({regionHosts.length} nodes)</span>
              <span className="font-bold">{expandedSections.has(region) ? '[ - ]' : '[ + ]'}</span>
            </button>
            {expandedSections.has(region) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 animate-in fade-in slide-in-from-top-1 duration-200">
                {regionHosts.map(host => (
                  <div key={host.id} className="relative overflow-hidden border border-green-800 p-4 cursor-pointer group hover:border-green-400 h-24 flex flex-col justify-center bg-black/40">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${host.status === 'online' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
                      <span className="text-lg font-bold tracking-tight">{host.name}</span>
                    </div>
                    <div className="absolute inset-0 bg-black/95 translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out p-3 flex flex-col justify-between border-t border-green-400 z-10">
                      <div className="flex justify-between items-center text-green-500">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-green-700 leading-none mb-1 font-mono uppercase">ADDR</span>
                          <span className="text-xs font-mono">{host.ip}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 mt-2">
                        <button onClick={(e) => { e.stopPropagation(); runTroubleshooting(host, 'ping -c 4 8.8.8.8'); }} className="flex-grow py-1 text-[9px] border border-green-600 hover:bg-green-500 hover:text-black transition-colors uppercase font-bold font-mono">ping</button>
                        <button onClick={(e) => { e.stopPropagation(); runTroubleshooting(host, 'df -h'); }} className="flex-grow py-1 text-[9px] border border-green-600 hover:bg-green-500 hover:text-black transition-colors uppercase font-bold font-mono">disk</button>
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
        <h2 className="text-xl font-bold uppercase tracking-widest">Server Scan Registry</h2>
        <button onClick={() => setMenuState(MenuState.MAIN)} className="text-xs hover:underline text-green-700 hover:text-green-400 font-mono">[ BACK ]</button>
      </div>
      <div className="space-y-4 overflow-y-auto max-h-[40vh] pr-2">
        {(Object.entries(hostsByRegion) as [string, Host[]][]).map(([region, regionHosts]) => (
          <div key={region} className="border border-green-900/50">
            <button onClick={() => toggleSection(`scan-${region}`)} className="w-full flex justify-between items-center p-2 bg-green-900/10 hover:bg-green-900/20 transition-colors font-mono text-xs uppercase tracking-wider border-b border-green-900/50">
              <span>REGIONAL DEPLOYMENT: {region}</span>
              <span className="font-bold">{expandedSections.has(`scan-${region}`) ? '[ - ]' : '[ + ]'}</span>
            </button>
            {expandedSections.has(`scan-${region}`) && (
              <div className="flex flex-wrap gap-2 p-3 animate-in fade-in slide-in-from-top-1 duration-200">
                {regionHosts.map(host => (
                  <button key={host.id} onClick={() => runFullScan(host)} className="px-4 py-2 border border-green-500 hover:bg-green-500 hover:text-black text-xs font-mono uppercase transition-all flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    INJECT: {host.name}
                  </button>
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
        <h2 className="text-xl font-bold uppercase tracking-widest">Web Security Analysis</h2>
        <button onClick={() => setMenuState(MenuState.MAIN)} className="text-xs hover:underline text-green-700 hover:text-green-400 font-mono">[ BACK ]</button>
      </div>
      <input 
        type="text" value={webUrl} onChange={(e) => setWebUrl(e.target.value)} placeholder="https://target-domain.internal"
        className="bg-black border border-green-500 text-green-500 px-4 py-2 focus:outline-none placeholder:text-green-900 font-mono"
      />
      <div className="space-y-4 overflow-y-auto max-h-[40vh] pr-2">
        {[{ name: 'Vulnerability', tools: ['ZAP Scanner', 'Nikto'] }, { name: 'Database', tools: ['Sqlmap (Automated)'] }].map(category => (
          <div key={category.name} className="border border-green-900/50">
            <button onClick={() => toggleSection(category.name)} className="w-full flex justify-between items-center p-2 bg-green-900/10 hover:bg-green-900/20 transition-colors font-mono text-xs uppercase tracking-wider border-b border-green-900/50">
              <span>{category.name} Suite</span>
              <span className="font-bold">{expandedSections.has(category.name) ? '[ - ]' : '[ + ]'}</span>
            </button>
            {expandedSections.has(category.name) && (
              <div className="grid grid-cols-2 gap-2 p-3">
                {category.tools.map(tool => (
                  <button key={tool} onClick={() => runWebScan(webUrl, tool)} className="p-2 border border-green-500 hover:bg-green-500 hover:text-black text-[10px] font-mono uppercase text-center">
                    {tool}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col p-4 md:p-8 max-w-7xl mx-auto overflow-hidden bg-[#050505]">
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
                <button onClick={() => switchUser('admin')} className={`w-full text-left p-2 text-[10px] font-mono uppercase hover:bg-green-500 hover:text-black ${currentUser === 'admin' ? 'bg-green-900/30' : ''}`}>
                  [ admin ]
                </button>
                <button onClick={() => switchUser('gustavw')} className={`w-full text-left p-2 text-[10px] font-mono uppercase hover:bg-green-500 hover:text-black ${currentUser === 'gustavw' ? 'bg-green-900/30' : ''}`}>
                  [ gustavw ]
                </button>
                <button onClick={() => switchUser('stephenc')} className={`w-full text-left p-2 text-[10px] font-mono uppercase hover:bg-green-500 hover:text-black ${currentUser === 'stephenc' ? 'bg-green-900/30' : ''}`}>
                  [ stephenc ]
                </button>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase">{currentUser}_OPS@NUCLEUS</h1>
            <p className="text-[10px] text-green-400 uppercase tracking-widest">Secure Shell Environment // Identity: Verified</p>
          </div>
        </div>
        
        <div className="text-right text-[10px] font-mono flex flex-col items-end gap-1">
          <div className="flex gap-2">
            <button 
              onClick={() => setMenuState(MenuState.CONFIG)}
              className="text-yellow-600 hover:text-yellow-400 border border-yellow-900 px-2 py-0.5 transition-colors uppercase"
            >
              [ SETTINGS ]
            </button>
            <span className="text-white bg-green-900 px-1">ACTIVE</span>
          </div>
          <div className="opacity-50">NODE_COUNT: {hosts.length} // SESSION: {Math.floor(Math.random() * 9999)}</div>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto mb-4 border border-green-900/30 bg-black/40 p-4 flex flex-col relative">
        <div className="space-y-1 flex-grow">
          {lines.map((line, i) => (
            <div key={i} className="flex gap-3 leading-tight animate-in fade-in slide-in-from-left-2 duration-300 font-mono">
              <span className="opacity-40 text-[10px] whitespace-nowrap pt-1">[{line.timestamp}]</span>
              <span className={`break-words ${line.type === 'error' ? 'text-red-500' : line.type === 'success' ? 'text-blue-400' : line.type === 'command' ? 'text-yellow-400 font-bold' : line.type === 'output' ? 'text-gray-300' : 'text-green-500'}`}>
                {line.type === 'command' && <span className="mr-1">➜</span>}
                {line.text}
              </span>
            </div>
          ))}
          {isProcessing && <div className="flex gap-2 items-center text-green-400 animate-pulse mt-2 font-mono"><span className="text-[10px]">SYSTEM BUSY...</span><div className="w-1 h-4 bg-green-500 animate-bounce" /></div>}
          <div ref={terminalEndRef} />
        </div>
        <div className="mt-4 border-t border-green-900/50 pt-3 flex items-center gap-2 font-mono">
          <span className="text-green-500 font-bold shrink-0">[{currentUser}@nucleus ~]$</span>
          <form onSubmit={handleCommandSubmit} className="flex-grow">
            <input ref={inputRef} type="text" value={commandInput} onChange={(e) => setCommandInput(e.target.value)} className="bg-transparent border-none text-green-400 focus:outline-none w-full caret-green-500" autoComplete="off" spellCheck="false" autoFocus />
          </form>
        </div>
      </main>

      <section className="mt-auto">
        {menuState === MenuState.MAIN && renderMainMenu()}
        {menuState === MenuState.JUMPHOSTS && renderJumphostsMenu()}
        {menuState === MenuState.SERVER_SCAN && renderServerScanMenu()}
        {menuState === MenuState.WEB_SCAN && renderWebScanMenu()}
        {menuState === MenuState.CONFIG && renderConfigMenu()}
        {menuState === MenuState.EXECUTING && (
          <div className="p-8 border border-green-900 bg-black flex items-center justify-center gap-4">
             <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full"></div>
             <div className="text-xl font-bold tracking-widest animate-pulse uppercase font-mono">Executing Remote Payload...</div>
          </div>
        )}
      </section>
    </div>
  );
};

export default App;
