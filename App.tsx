
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MenuState, TerminalLine, Host } from './types';
import { NUCLEUS_HOSTS, OWASP_TOOLS } from './constants';
import { simulateTroubleshooting, simulateServerScan, simulateWebScan } from './services/gemini';

const App: React.FC = () => {
  const [menuState, setMenuState] = useState<MenuState>(MenuState.MAIN);
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedHost, setSelectedHost] = useState<Host | null>(null);
  const [webUrl, setWebUrl] = useState('');
  const terminalEndRef = useRef<HTMLDivElement>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAction = async (action: () => Promise<void>) => {
    setIsProcessing(true);
    try {
      await action();
    } catch (error) {
      addLine(`CRITICAL ERROR: ${error}`, 'error');
    } finally {
      setIsProcessing(false);
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
      
      // Simulate real-time streaming feel
      const chunks = result.split('\n');
      for (const chunk of chunks) {
        addLine(chunk, 'output');
        await new Promise(r => setTimeout(r, 100)); // Visual pacing
      }
      
      addLine(`Scan script /tmp/nucleus_scan_${host.id}.sh removed successfully.`, 'success');
      addLine(`Connection to ${host.name} closed.`, 'info');
      setMenuState(MenuState.MAIN);
    });
  };

  const runWebScan = (tool: string) => {
    if (!webUrl) {
      addLine("ERROR: TARGET URL NOT SPECIFIED", "error");
      return;
    }
    setMenuState(MenuState.EXECUTING);
    handleAction(async () => {
      addLine(`$ ${tool.toLowerCase().replace(' ', '_')} --target ${webUrl} --aggressive`, 'command');
      const result = await simulateWebScan(webUrl, tool);
      result.split('\n').forEach(line => addLine(line, 'output'));
      setMenuState(MenuState.MAIN);
    });
  };

  const renderMainMenu = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-green-900 bg-black/40">
      <button 
        onClick={() => setMenuState(MenuState.JUMPHOSTS)}
        className="p-4 border border-green-500 hover:bg-green-500 hover:text-black transition-colors flex flex-col items-center"
      >
        <span className="text-xl font-bold">[ 1 ]</span>
        <span>JUMPHOSTS / TROUBLESHOOTING</span>
      </button>
      <button 
        onClick={() => setMenuState(MenuState.SERVER_SCAN)}
        className="p-4 border border-green-500 hover:bg-green-500 hover:text-black transition-colors flex flex-col items-center"
      >
        <span className="text-xl font-bold">[ 2 ]</span>
        <span>SERVER SCAN (REMOTE SCRIPT)</span>
      </button>
      <button 
        onClick={() => setMenuState(MenuState.WEB_SCAN)}
        className="p-4 border border-green-500 hover:bg-green-500 hover:text-black transition-colors flex flex-col items-center"
      >
        <span className="text-xl font-bold">[ 3 ]</span>
        <span>WEB VULN / OWASP TOOLS</span>
      </button>
    </div>
  );

  const renderJumphostsMenu = () => (
    <div className="flex flex-col gap-4 p-4 border border-green-900">
      <div className="flex justify-between items-center border-b border-green-800 pb-2">
        <h2 className="text-xl font-bold uppercase tracking-widest">Select Target Host</h2>
        <button onClick={() => setMenuState(MenuState.MAIN)} className="text-xs hover:underline text-green-700 hover:text-green-400">[ BACK ]</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {NUCLEUS_HOSTS.map(host => (
          <div 
            key={host.id} 
            className="relative overflow-hidden border border-green-800 p-4 cursor-pointer group transition-colors hover:border-green-400 h-24 flex flex-col justify-center"
          >
            {/* Standard View */}
            <div className="flex items-center gap-3">
              <div 
                className={`w-3 h-3 rounded-full ${host.status === 'online' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} 
              />
              <span className="text-lg font-bold tracking-tight">{host.name}</span>
            </div>
            <div className="text-[10px] text-green-900 mt-1 uppercase tracking-tighter">Hover for details</div>

            {/* Hover Overlay Detail View */}
            <div className="absolute inset-0 bg-black/95 translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out p-3 flex flex-col justify-between border-t border-green-400 z-10">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] text-green-700 leading-none mb-1 font-mono">NETWORK_ADDR</span>
                  <span className="text-xs text-green-300 font-mono">{host.ip}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-green-700 leading-none mb-1 font-mono">AVAIL_ZONE</span>
                  <span className="text-[10px] text-green-500 bg-green-900/30 px-1 border border-green-800 uppercase font-mono">{host.region}</span>
                </div>
              </div>
              
              <div className="flex gap-1 mt-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); runTroubleshooting(host, 'ping -c 4 8.8.8.8'); }} 
                  className="flex-grow py-1 text-[9px] border border-green-600 hover:bg-green-500 hover:text-black transition-colors uppercase font-bold font-mono"
                >
                  ping
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); runTroubleshooting(host, 'df -h'); }} 
                  className="flex-grow py-1 text-[9px] border border-green-600 hover:bg-green-500 hover:text-black transition-colors uppercase font-bold font-mono"
                >
                  disk
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); runTroubleshooting(host, 'tail -n 20 /var/log/syslog'); }} 
                  className="flex-grow py-1 text-[9px] border border-green-600 hover:bg-green-500 hover:text-black transition-colors uppercase font-bold font-mono"
                >
                  logs
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderServerScanMenu = () => (
    <div className="flex flex-col gap-4 p-4 border border-green-900">
      <div className="flex justify-between items-center border-b border-green-800 pb-2">
        <h2 className="text-xl font-bold">SERVER SCAN CONFIG</h2>
        <button onClick={() => setMenuState(MenuState.MAIN)} className="text-xs hover:underline">[ BACK ]</button>
      </div>
      <p className="text-xs text-green-400">Selecting a host will deploy a Nucleus-Auditor script, run diagnostics, and auto-cleanup.</p>
      <div className="flex flex-wrap gap-2">
        {NUCLEUS_HOSTS.map(host => (
          <button 
            key={host.id} 
            onClick={() => runFullScan(host)}
            className="px-4 py-2 border border-green-500 hover:bg-green-500 hover:text-black text-sm"
          >
            RUN ON: {host.name}
          </button>
        ))}
      </div>
    </div>
  );

  const renderWebScanMenu = () => (
    <div className="flex flex-col gap-4 p-4 border border-green-900">
      <div className="flex justify-between items-center border-b border-green-800 pb-2">
        <h2 className="text-xl font-bold">WEB SECURITY SUITE</h2>
        <button onClick={() => setMenuState(MenuState.MAIN)} className="text-xs hover:underline">[ BACK ]</button>
      </div>
      <div className="flex gap-2">
        <input 
          type="text" 
          value={webUrl}
          onChange={(e) => setWebUrl(e.target.value)}
          placeholder="https://target-nucleus-app.io"
          className="bg-black border border-green-500 text-green-500 px-4 py-2 flex-grow focus:outline-none placeholder:text-green-900"
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {OWASP_TOOLS.map(tool => (
          <button 
            key={tool}
            onClick={() => runWebScan(tool)}
            className="p-2 border border-green-500 hover:bg-green-500 hover:text-black text-xs"
          >
            {tool}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col p-4 md:p-8 max-w-7xl mx-auto overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-start mb-4 border-b border-green-500 pb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter">NUCLEUS_OPS@TERMINAL_01</h1>
          <p className="text-[10px] text-green-400 uppercase tracking-widest">Secure Shell Environment // Node: {window.location.hostname}</p>
        </div>
        <div className="text-right text-[10px]">
          <div>STATUS: <span className="text-white bg-green-900 px-1">ACTIVE</span></div>
          <div>CPU_LOAD: 0.12 0.08 0.05</div>
        </div>
      </header>

      {/* Terminal Output Area */}
      <main className="flex-grow overflow-y-auto mb-4 border border-green-900/50 bg-black/20 p-4 scroll-smooth">
        <div className="space-y-1">
          {lines.map((line, i) => (
            <div key={i} className="flex gap-3 leading-tight animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="opacity-40 text-[10px] whitespace-nowrap pt-1 font-mono">[{line.timestamp}]</span>
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
            <div className="flex gap-2 items-center text-green-400 animate-pulse mt-2">
              <span className="text-[10px]">PROCESING...</span>
              <div className="w-1 h-4 bg-green-500 animate-bounce" />
            </div>
          )}
          <div ref={terminalEndRef} />
        </div>
      </main>

      {/* Bottom Interface / Menu */}
      <section className="mt-auto">
        {menuState === MenuState.MAIN && renderMainMenu()}
        {menuState === MenuState.JUMPHOSTS && renderJumphostsMenu()}
        {menuState === MenuState.SERVER_SCAN && renderServerScanMenu()}
        {menuState === MenuState.WEB_SCAN && renderWebScanMenu()}
        {menuState === MenuState.EXECUTING && (
          <div className="p-8 border border-green-900 bg-black flex items-center justify-center gap-4">
             <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full"></div>
             <div className="text-xl font-bold tracking-widest animate-pulse uppercase">Executing Remote Payload...</div>
          </div>
        )}
      </section>

      {/* ASCII Tree Representation (Visual Decoration) */}
      <div className="fixed bottom-4 right-8 hidden xl:block opacity-20 text-[8px] pointer-events-none select-none font-mono">
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
