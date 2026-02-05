
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MenuState, TerminalLine, Host } from './types';
import { NUCLEUS_HOSTS, OWASP_TOOLS } from './constants';
import { simulateTroubleshooting, simulateServerScan, simulateWebScan } from './services/gemini';

const App: React.FC = () => {
  const [menuState, setMenuState] = useState<MenuState>(MenuState.MAIN);
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [webUrl, setWebUrl] = useState('');
  const [commandInput, setCommandInput] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['us-east-1', 'Vulnerability']));
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    addLine("SYSTEM INITIALIZED. NUCLEUS OPS CONSOLE v2.4.0", "success");
    addLine("Type 'help' for available commands or use the menu below.");
    // Auto-focus input on load
    inputRef.current?.focus();
  }, [addLine]);

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
      // Refocus input after action
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const runTroubleshooting = (host: Host, command: string) => {
    handleAction(async () => {
      addLine(`$ ssh admin@${host.ip} "${command}"`, 'command');
      const result = await simulateTroubleshooting(host.name, command);
      result.split('\n').forEach(line => addLine(line, 'output'));
    });
  };

  const runFullScan = (host: Host) => {
    setMenuState(MenuState.EXECUTING);
    handleAction(async () => {
      addLine(`$ curl -sSL https://nucleus.internal/scripts/scan.sh | bash -s -- --host ${host.name}`, 'command');
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
      addLine(`$ ${tool.toLowerCase().replace(' ', '_')} --target ${url} --aggressive`, 'command');
      const result = await simulateWebScan(url, tool);
      result.split('\n').forEach(line => addLine(line, 'output'));
      setMenuState(MenuState.MAIN);
    });
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = commandInput.trim().toLowerCase();
    if (!cmd) return;

    addLine(`[admin@nucleus ~]$ ${commandInput}`, 'command');
    setCommandInput('');

    const parts = cmd.split(' ');
    const base = parts[0];
    const arg1 = parts[1];
    const arg2 = parts[2];

    switch (base) {
      case 'help':
        addLine("AVAILABLE COMMANDS:", "success");
        addLine("  ls             - List all hosts");
        addLine("  ping [host]    - Ping a specific host");
        addLine("  disk [host]    - Check disk usage on host");
        addLine("  logs [host]    - Tail logs on host");
        addLine("  scan [host]    - Run full security scan on host");
        addLine("  web [url] [tool] - Run web vulnerability tool");
        addLine("  clear          - Clear terminal output");
        addLine("  menu [main|jump|scan|web] - Switch menu view");
        break;
      case 'clear':
        setLines([]);
        break;
      case 'ls':
        addLine("HOST REGISTRY:", "success");
        NUCLEUS_HOSTS.forEach(h => addLine(`  ${h.name.padEnd(20)} ${h.ip.padEnd(15)} [${h.status}]`));
        break;
      case 'menu':
        if (arg1 === 'main') setMenuState(MenuState.MAIN);
        else if (arg1 === 'jump') setMenuState(MenuState.JUMPHOSTS);
        else if (arg1 === 'scan') setMenuState(MenuState.SERVER_SCAN);
        else if (arg1 === 'web') setMenuState(MenuState.WEB_SCAN);
        else addLine("Usage: menu [main|jump|scan|web]", "error");
        break;
      case 'ping':
      case 'disk':
      case 'logs':
      case 'scan':
        const host = NUCLEUS_HOSTS.find(h => h.name === arg1 || h.ip === arg1);
        if (!host) {
          addLine(`Host '${arg1}' not found. Use 'ls' to see active hosts.`, "error");
        } else {
          if (base === 'ping') runTroubleshooting(host, 'ping -c 4 8.8.8.8');
          else if (base === 'disk') runTroubleshooting(host, 'df -h');
          else if (base === 'logs') runTroubleshooting(host, 'tail -n 20 /var/log/syslog');
          else if (base === 'scan') runFullScan(host);
        }
        break;
      case 'web':
        if (!arg1) {
          addLine("Usage: web [url] [tool]", "error");
        } else {
          const tool = arg2 ? OWASP_TOOLS.find(t => t.toLowerCase().includes(arg2)) || OWASP_TOOLS[0] : OWASP_TOOLS[0];
          runWebScan(arg1, tool);
        }
        break;
      default:
        addLine(`Command not found: ${base}. Type 'help' for assistance.`, "error");
    }
  };

  const hostsByRegion = useMemo(() => {
    return NUCLEUS_HOSTS.reduce((acc, host) => {
      if (!acc[host.region]) acc[host.region] = [];
      acc[host.region].push(host);
      return acc;
    }, {} as Record<string, Host[]>);
  }, []);

  const webToolCategories = [
    { name: 'Vulnerability', tools: ['ZAP Scanner', 'Nikto'] },
    { name: 'Database', tools: ['Sqlmap (Automated)'] },
    { name: 'Network & SSL', tools: ['SSLScan'] },
    { name: 'Discovery', tools: ['Dirb'] }
  ];

  const renderMainMenu = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-green-900 bg-black/40">
      <button 
        onClick={() => setMenuState(MenuState.JUMPHOSTS)}
        className="p-6 border border-green-500 hover:bg-green-500 hover:text-black transition-all flex flex-col items-center group relative overflow-hidden h-36 justify-center"
      >
        <span className="text-2xl font-black mb-1 group-hover:-translate-y-4 transition-transform duration-300">[ 1 ]</span>
        <span className="font-bold tracking-widest text-xs uppercase group-hover:-translate-y-4 transition-transform duration-300">JUMPHOSTS</span>
        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-none">
           <p className="text-[10px] text-center leading-tight font-mono">Access and troubleshoot remote nodes via encrypted tunnels.</p>
        </div>
      </button>

      <button 
        onClick={() => setMenuState(MenuState.SERVER_SCAN)}
        className="p-6 border border-green-500 hover:bg-green-500 hover:text-black transition-all flex flex-col items-center group relative overflow-hidden h-36 justify-center"
      >
        <span className="text-2xl font-black mb-1 group-hover:-translate-y-4 transition-transform duration-300">[ 2 ]</span>
        <span className="font-bold tracking-widest text-xs uppercase group-hover:-translate-y-4 transition-transform duration-300 text-center">SERVER SCAN</span>
        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-none">
           <p className="text-[10px] text-center leading-tight font-mono">Deploy remote diagnostics scripts to audit system health and security.</p>
        </div>
      </button>

      <button 
        onClick={() => setMenuState(MenuState.WEB_SCAN)}
        className="p-6 border border-green-500 hover:bg-green-500 hover:text-black transition-all flex flex-col items-center group relative overflow-hidden h-36 justify-center"
      >
        <span className="text-2xl font-black mb-1 group-hover:-translate-y-4 transition-transform duration-300">[ 3 ]</span>
        <span className="font-bold tracking-widest text-xs uppercase group-hover:-translate-y-4 transition-transform duration-300">WEB VULN</span>
        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-none">
           <p className="text-[10px] text-center leading-tight font-mono">Run OWASP-standard security audits against web targets.</p>
        </div>
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
        {Object.entries(hostsByRegion).map(([region, hosts]) => (
          <div key={region} className="border border-green-900/50">
            <button 
              onClick={() => toggleSection(region)}
              className="w-full flex justify-between items-center p-2 bg-green-900/10 hover:bg-green-900/20 transition-colors font-mono text-xs uppercase tracking-wider border-b border-green-900/50"
            >
              <span>{region} ({hosts.length} nodes)</span>
              <span className="font-bold">{expandedSections.has(region) ? '[ - ]' : '[ + ]'}</span>
            </button>
            {expandedSections.has(region) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 animate-in fade-in slide-in-from-top-1 duration-200">
                {hosts.map(host => (
                  <div 
                    key={host.id} 
                    className="relative overflow-hidden border border-green-800 p-4 cursor-pointer group transition-colors hover:border-green-400 h-24 flex flex-col justify-center bg-black/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${host.status === 'online' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
                      <span className="text-lg font-bold tracking-tight">{host.name}</span>
                    </div>
                    <div className="text-[10px] text-green-900 mt-1 uppercase tracking-tighter">Hover for actions</div>

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
                        <button onClick={(e) => { e.stopPropagation(); runTroubleshooting(host, 'tail -n 20 /var/log/syslog'); }} className="flex-grow py-1 text-[9px] border border-green-600 hover:bg-green-500 hover:text-black transition-colors uppercase font-bold font-mono">logs</button>
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
      <p className="text-xs text-green-400 font-mono opacity-80 italic">Auditor-Engine deployment registry. Select regional targets for injection.</p>
      
      <div className="space-y-4 overflow-y-auto max-h-[40vh] pr-2">
        {Object.entries(hostsByRegion).map(([region, hosts]) => (
          <div key={region} className="border border-green-900/50">
            <button 
              onClick={() => toggleSection(`scan-${region}`)}
              className="w-full flex justify-between items-center p-2 bg-green-900/10 hover:bg-green-900/20 transition-colors font-mono text-xs uppercase tracking-wider border-b border-green-900/50"
            >
              <span>REGIONAL DEPLOYMENT: {region}</span>
              <span className="font-bold">{expandedSections.has(`scan-${region}`) ? '[ - ]' : '[ + ]'}</span>
            </button>
            {expandedSections.has(`scan-${region}`) && (
              <div className="flex flex-wrap gap-2 p-3 animate-in fade-in slide-in-from-top-1 duration-200">
                {hosts.map(host => (
                  <button 
                    key={host.id} 
                    onClick={() => runFullScan(host)}
                    className="px-4 py-2 border border-green-500 hover:bg-green-500 hover:text-black text-xs font-mono uppercase transition-all flex items-center gap-2"
                  >
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
      <div className="flex gap-2">
        <input 
          type="text" 
          value={webUrl}
          onChange={(e) => setWebUrl(e.target.value)}
          placeholder="https://target-domain.internal"
          className="bg-black border border-green-500 text-green-500 px-4 py-2 flex-grow focus:outline-none placeholder:text-green-900 font-mono"
        />
      </div>
      
      <div className="space-y-4 overflow-y-auto max-h-[40vh] pr-2">
        {webToolCategories.map(category => (
          <div key={category.name} className="border border-green-900/50">
            <button 
              onClick={() => toggleSection(category.name)}
              className="w-full flex justify-between items-center p-2 bg-green-900/10 hover:bg-green-900/20 transition-colors font-mono text-xs uppercase tracking-wider border-b border-green-900/50"
            >
              <span>{category.name} Suite</span>
              <span className="font-bold">{expandedSections.has(category.name) ? '[ - ]' : '[ + ]'}</span>
            </button>
            {expandedSections.has(category.name) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-3 animate-in fade-in slide-in-from-top-1 duration-200">
                {category.tools.map(tool => (
                  <button 
                    key={tool}
                    onClick={() => runWebScan(webUrl, tool)}
                    className="p-2 border border-green-500 hover:bg-green-500 hover:text-black text-[10px] font-mono uppercase transition-all text-center"
                  >
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
      <header className="flex justify-between items-start mb-4 border-b border-green-500 pb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter">NUCLEUS_OPS@TERMINAL_01</h1>
          <p className="text-[10px] text-green-400 uppercase tracking-widest">Secure Shell Environment // Node: {window.location.hostname}</p>
        </div>
        <div className="text-right text-[10px] font-mono">
          <div>STATUS: <span className="text-white bg-green-900 px-1">ACTIVE</span></div>
          <div>CPU_LOAD: 0.12 0.08 0.05</div>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto mb-4 border border-green-900/30 bg-black/40 p-4 scroll-smooth flex flex-col">
        <div className="space-y-1 flex-grow">
          {lines.map((line, i) => (
            <div key={i} className="flex gap-3 leading-tight animate-in fade-in slide-in-from-left-2 duration-300 font-mono">
              <span className="opacity-40 text-[10px] whitespace-nowrap pt-1">[{line.timestamp}]</span>
              <span className={`break-words ${
                line.type === 'error' ? 'text-red-500' :
                line.type === 'success' ? 'text-blue-400' :
                line.type === 'command' ? 'text-yellow-400 font-bold' :
                line.type === 'output' ? 'text-gray-300' : 'text-green-500'
              }`}>
                {line.type === 'command' && <span className="mr-1">➜</span>}
                {line.text}
              </span>
            </div>
          ))}
          {isProcessing && (
            <div className="flex gap-2 items-center text-green-400 animate-pulse mt-2 font-mono">
              <span className="text-[10px]">SYSTEM BUSY...</span>
              <div className="w-1 h-4 bg-green-500 animate-bounce" />
            </div>
          )}
          <div ref={terminalEndRef} />
        </div>

        {/* Command Line Input */}
        <div className="mt-4 border-t border-green-900/50 pt-3 flex items-center gap-2 font-mono">
          <span className="text-green-500 font-bold shrink-0">[admin@nucleus ~]$</span>
          <form onSubmit={handleCommandSubmit} className="flex-grow">
            <input
              ref={inputRef}
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              className="bg-transparent border-none text-green-400 focus:outline-none w-full caret-green-500"
              autoComplete="off"
              spellCheck="false"
              autoFocus
            />
          </form>
        </div>
      </main>

      <section className="mt-auto">
        {menuState === MenuState.MAIN && renderMainMenu()}
        {menuState === MenuState.JUMPHOSTS && renderJumphostsMenu()}
        {menuState === MenuState.SERVER_SCAN && renderServerScanMenu()}
        {menuState === MenuState.WEB_SCAN && renderWebScanMenu()}
        {menuState === MenuState.EXECUTING && (
          <div className="p-8 border border-green-900 bg-black flex items-center justify-center gap-4">
             <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full"></div>
             <div className="text-xl font-bold tracking-widest animate-pulse uppercase font-mono">Executing Remote Payload...</div>
          </div>
        )}
      </section>

      <div className="fixed bottom-4 right-8 hidden xl:block opacity-10 text-[8px] pointer-events-none select-none font-mono">
<pre>{`
nucleus-ops-root
├── bin
│   ├── jump-auth
│   ├── scan-engine
│   └── vuln-zap
├── etc
│   ├── hosts.conf
│   └── regions
└── var
    ├── log
    └── spool
`}</pre>
      </div>
    </div>
  );
};

export default App;
