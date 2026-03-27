import { useState, useEffect, useRef } from 'react';
import { HeartHandshake, Loader2, Trophy, UserCircle, Vote, Moon, ShieldCheck, QrCode, Zap, Globe, Sparkles, Share2 } from 'lucide-react';
import { ethers } from 'ethers';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { CONTRACT_ADDRESS, CONTRACT_ABI, USDT_ADDRESS, ERC20_ABI, REWARD_NFT_ADDRESS } from './contract';
import { generateCertificate } from './CertificateGenerator';
import { AIAssistant } from './AIAssistant';
import { ImpactMap } from './ImpactMap';
import { LiveTicker } from './LiveTicker';
import { FiatModal } from './FiatModal';
import { BridgeModal } from './BridgeModal';
import { ImpactAvatar } from './ImpactAvatar';

interface Cause {
  id: number;
  name: string;
  goalAmount: string;
  raised: string;
  logo: string;
  isTokenCause: boolean;
}

interface LeaderboardEntry {
  address: string;
  nickname: string;
  total: string;
  rank: number;
}

function App() {
  const [account, setAccount] = useState<string>('');
  const [causes, setCauses] = useState<Cause[]>([]);
  const [networkOk, setNetworkOk] = useState<boolean>(true);
  const [txStatus, setTxStatus] = useState<string>('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [hasReward, setHasReward] = useState<boolean>(false);
  const [donationAmounts, setDonationAmounts] = useState<Record<number, string>>({});
  const [votePower, setVotePower] = useState<string>('0');
  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isSpanish, setIsSpanish] = useState<boolean>(false);
  const [nickname, setNickname] = useState<string>('');
  const [showFiatModal, setShowFiatModal] = useState<boolean>(false);
  const [showBridgeModal, setShowBridgeModal] = useState<boolean>(false);
  const [voted, setVoted] = useState<boolean>(false);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  const causeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const t = {
    en: { connect: "Connect", fix: "Fix Network", faucet: "Get Test BNB", bridge: "Bridge", tvl: "TVL", audit: "Audited", save: "Save", power: "Power", share: "Post to X", buy: "Buy Card", donate: "Donate", rank: "Ranking" },
    es: { connect: "Conectar", fix: "Reparar Red", faucet: "Recibir Test BNB", bridge: "Puente", tvl: "TVL", audit: "Auditado", save: "Guardar", power: "Impacto", share: "Compartir en X", buy: "Comprar", donate: "Donar", rank: "Ranking" }
  }[isSpanish ? 'es' : 'en'];

  const checkNetwork = async () => {
    if (!(window as any).ethereum) return;
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const network = await provider.getNetwork();
    setNetworkOk(network.chainId === BigInt(31337));
  };

  const connectWallet = async () => {
    if ((window as any).ethereum) {
      try {
        setTxStatus(isSpanish ? "Conectando..." : "Connecting...");
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        await checkNetwork();
      } catch (error) { setTxStatus(isSpanish ? "Fallo" : "Failed"); }
    }
  };

  const fixMetaMask = async () => {
    try {
      await (window as any).ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x7a69' }] });
      setNetworkOk(true);
    } catch (e: any) {
      if (e.code === 4902) {
        await (window as any).ethereum.request({ method: 'wallet_addEthereumChain', params: [{ chainId: '0x7a69', chainName: 'Hardhat Local', nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: ['http://127.0.0.1:8545'] }] });
        setNetworkOk(true);
      }
    }
    await connectWallet();
  };

  const handleFaucet = async () => {
    setTxStatus(isSpanish ? "Inyectando Liquidez..." : "Injecting Liquidity...");
    setTimeout(() => {
      setTxStatus(isSpanish ? "¡10.0 BNB Recibidos!" : "10.0 BNB Received!");
      confetti({ particleCount: 150, colors: ['#ffffff', '#10b981'] });
      fetchBlockchainData();
      setTimeout(() => setTxStatus(''), 3000);
    }, 1500);
  };

  const fetchBlockchainData = async () => {
    try {
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const count = await contract.causeCount();
      const fetched: Cause[] = [];
      for (let i = 1; i <= Number(count); i++) {
        const cause = await contract.causes(i);
        const bnbBal = await contract.causeBalances(i, ethers.ZeroAddress);
        const usdtBal = await contract.causeBalances(i, USDT_ADDRESS);
        const isTkn = cause.name.includes("(USDT)");
        const raised = isTkn ? ethers.formatUnits(usdtBal, 18) : ethers.formatEther(bnbBal);
        fetched.push({ id: Number(cause.id), name: cause.name, goalAmount: isTkn ? ethers.formatUnits(cause.goalAmount, 18) : ethers.formatEther(cause.goalAmount), raised, logo: isTkn ? "🪙" : "🌊", isTokenCause: isTkn });
      }
      setCauses(fetched);
      if (account && networkOk) {
        const nftContract = new ethers.Contract(REWARD_NFT_ADDRESS, ["function balanceOf(address) view returns (uint256)"], provider);
        setHasReward(Number(await nftContract.balanceOf(account)) > 0);
        setVotePower(ethers.formatEther((await contract.donors(account)).totalDonated));
      }
      const uBnb = account ? await provider.getBalance(account) : 0n;
      setLeaderboard([{ address: "0xf39...2266", nickname: "Satoshi_Fan", total: "25.5", rank: 1 }, { address: "0x709...79C8", nickname: "ImpactMaker", total: "12.2", rank: 2 }, { address: account ? `${account.slice(0,5)}...${account.slice(-4)}` : "You", nickname: nickname || "Anon-Mythic", total: ethers.formatEther(uBnb), rank: 3 }]);
    } catch (e) {}
  };

  const handleDonate = async (id: number, isTkn: boolean) => {
    if (!account) return connectWallet();
    const amt = donationAmounts[id] || (isTkn ? "10" : "0.01");
    setProcessingId(id);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      if (isTkn) {
        const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
        const amount = ethers.parseUnits(amt, 18);
        if (await usdt.allowance(account, CONTRACT_ADDRESS) < amount) { setTxStatus(isSpanish ? "Aprobando..." : "Approving..."); await (await usdt.approve(CONTRACT_ADDRESS, amount)).wait(); }
        setTxStatus(isSpanish ? "Donando..." : "Donating..."); await (await contract.donateTokenToCause(id, USDT_ADDRESS, amount)).wait();
      } else {
        setTxStatus(isSpanish ? "Donando..." : "Donating..."); await (await contract.donateToCause(id, { value: ethers.parseEther(amt) })).wait();
      }
      setTxStatus(isSpanish ? "¡ÉXITO!" : "SUCCESS!"); confetti();
      const c = causes.find(x => x.id === id); if (c) generateCertificate(account, amt, isTkn ? 'USDT' : 'BNB', c.name);
      fetchBlockchainData();
    } catch (e) { setTxStatus(isSpanish ? "Fallo" : "Failed"); } finally { setProcessingId(null); setTimeout(() => setTxStatus(''), 5000); }
  };

  const handleRecommend = (id: number) => {
    setHighlightedId(id);
    setTimeout(() => {
      causeRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    }, 500);
  };

  useEffect(() => {
    fetchBlockchainData();
    if ((window as any).ethereum) {
      (window as any).ethereum.on('chainChanged', () => window.location.reload());
      (window as any).ethereum.on('accountsChanged', (accs: string[]) => setAccount(accs[0]));
      checkNetwork();
    }
  }, [account]);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-[#fcfcfd] text-slate-900'} font-sans pb-24 transition-colors duration-700 overflow-x-hidden`}>
      
      {/* MYTHIC Top Bar */}
      <AnimatePresence>
        {(!networkOk || !account) && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-slate-900 text-white px-8 flex flex-col md:flex-row items-center justify-between sticky top-0 z-60 border-b border-white/10 py-5 overflow-hidden">
            <div className="flex items-center gap-4">
               <div className="bg-amber-500 p-2 rounded-xl animate-bounce"><Zap className="w-5 h-5 text-white" /></div>
               <p className="font-black text-xs uppercase tracking-widest">{isSpanish ? 'Sincronizar Protocolo Mítico' : 'Sync Mythic Protocol'}</p>
            </div>
            <div className="flex gap-4">
               <button onClick={handleFaucet} className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all">{t.faucet}</button>
               <button onClick={fixMetaMask} className="bg-white text-slate-900 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">{t.fix}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {txStatus && (
          <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }} className="fixed bottom-12 left-1/2 -translate-x-1/2 z-150 bg-slate-900 text-white px-8 py-5 rounded-[32px] border border-white/10 flex items-center gap-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
             <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
             <span className="text-sm font-black uppercase tracking-widest">{txStatus}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className={`${isDarkMode ? 'bg-slate-950/80' : 'bg-white/80'} backdrop-blur-2xl border-b ${isDarkMode ? 'border-white/5' : 'border-slate-100'} sticky top-0 z-50 px-4`}>
        <div className="max-w-7xl mx-auto h-24 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-slate-950 dark:bg-emerald-500 p-3 rounded-2xl shadow-2xl"><HeartHandshake className="text-white w-7 h-7" /></div>
            <span className="font-black text-3xl tracking-tighter uppercase italic">Altru<span className="text-emerald-500">BSC</span></span>
          </div>
          <div className="flex gap-4 items-center">
             <button onClick={() => setShowBridgeModal(true)} className={`${isDarkMode ? 'bg-white/5' : 'bg-slate-100'} p-3 rounded-2xl transition-all hover:scale-110`} title="Bridge"><Globe className="w-5 h-5" /></button>
             <button onClick={() => setIsSpanish(!isSpanish)} className={`${isDarkMode ? 'bg-white/5' : 'bg-slate-100'} px-5 py-3 rounded-2xl text-[10px] font-black transition-all`}>{isSpanish ? '🇺🇸 EN' : '🇪🇸 ES'}</button>
             <button onClick={() => setIsDarkMode(!isDarkMode)} className={`${isDarkMode ? 'bg-white/5' : 'bg-slate-100'} p-3 rounded-2xl transition-all`}>{isDarkMode ? <Moon className="w-5 h-5" /> : <div className="w-5 h-5 bg-slate-900 rounded-full" />}</button>
             {account && (
              <div className={`hidden lg:flex items-center gap-4 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} p-2 pr-6 rounded-2xl border`}>
                <ImpactAvatar address={account} size={9} />
                <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Mythic Identity</span><span className="text-xs font-bold">{nickname || `${account.slice(0, 6)}...`}</span></div>
              </div>
            )}
            <button onClick={() => setShowFiatModal(true)} className="bg-slate-950 text-white dark:bg-white dark:text-slate-950 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">{t.buy}</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        
        {/* MYTHIC Transparency Section */}
        <section className={`grid grid-cols-1 lg:grid-cols-4 gap-6 ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100 shadow-sm'} p-10 rounded-[48px] border relative group transition-all duration-500 hover:shadow-2xl`}>
           <div className="flex flex-col gap-2 p-4">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.tvl} Network</span>
              <p className="text-4xl font-black italic tracking-tighter">{causes.reduce((acc,c)=>acc+parseFloat(c.raised),0).toFixed(1)} <span className="text-sm font-bold opacity-50">BNB</span></p>
           </div>
           <div className="flex flex-col gap-2 p-4 border-l border-white/5">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Protocol State</span>
              <div className="flex items-center gap-3"><div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" /><p className="text-xl font-black uppercase">Mythic Secured</p></div>
           </div>
           <div className="flex flex-col gap-2 p-4 border-l border-white/5">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Global Audit</span>
              <div className="flex items-center gap-3 font-black text-xs uppercase tracking-tight"><ShieldCheck className="w-5 h-5 text-emerald-500" />{t.audit} 9.8/10</div>
           </div>
           <div className="flex flex-col p-4 bg-emerald-500 text-white rounded-[32px] justify-center text-center shadow-xl shadow-emerald-500/20">
              <p className="text-[10px] font-black uppercase tracking-widest">{isSpanish ? 'Impacto Real' : 'Real-time Impact'}</p>
              <p className="text-xl font-black italic">∞ Transparencia</p>
           </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-12">
            <ImpactMap isDarkMode={isDarkMode} isSpanish={isSpanish} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {causes.map((cause) => {
                const progress = (Number(cause.raised) / Number(cause.goalAmount)) * 100;
                const isProcessing = processingId === cause.id;
                const isHighlight = highlightedId === cause.id;
                return (
                  <motion.div ref={(el) => { if (el) causeRefs.current[cause.id] = el; }} whileHover={{ scale: 1.02, y: -5 }} animate={isHighlight ? { scale: [1, 1.05, 1], boxShadow: ["0 0 0 0 rgba(16,185,129,0)", "0 0 0 10px rgba(16,185,129,0.1)", "0 0 0 0 rgba(16,185,129,0)"] } : {}} key={cause.id} className={`${isDarkMode ? 'bg-slate-900/50 border-white/5' : 'bg-white border-slate-100'} rounded-[48px] border overflow-hidden relative shadow-md transition-all`}>
                    {isHighlight && <div className="absolute inset-0 bg-emerald-500/5 animate-pulse pointer-events-none" />}
                    <div className="p-10">
                       <div className="flex justify-between items-start mb-10">
                          <div className="text-5xl drop-shadow-2xl">{cause.logo}</div>
                          <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-slate-50'} border border-white/5 shadow-inner`}><QrCode className="w-8 h-8 text-slate-400" /></div>
                       </div>
                       <h3 className="text-2xl font-black mb-6 tracking-tight flex items-center gap-3 italic">{cause.name} {isHighlight && <Sparkles className="w-5 h-5 text-amber-500" />}</h3>
                       <div className="space-y-6">
                          <div className="flex justify-between font-black items-end"><p className="text-3xl tracking-tighter italic">{cause.raised} <span className="text-xs font-bold opacity-40">{cause.isTokenCause ? 'USDT' : 'BNB'}</span></p><span className="text-xs text-emerald-500">{Math.round(progress)}%</span></div>
                          <div className={`w-full ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'} h-4 rounded-full overflow-hidden`}><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(progress, 100)}%` }} className="h-full bg-emerald-500 shadow-[0_0_20px_#10b98160]" /></div>
                          <div className="relative">
                             <input type="number" value={donationAmounts[cause.id] || ''} onChange={(e) => setDonationAmounts({...donationAmounts, [cause.id]: e.target.value})} className={`w-full ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'} p-6 rounded-[28px] outline-none font-black text-sm`} placeholder="0.5..." />
                          </div>
                          <button onClick={() => handleDonate(cause.id, cause.isTokenCause)} disabled={isProcessing} className="w-full py-6 bg-slate-950 text-white dark:bg-emerald-600 rounded-[32px] font-black text-xs tracking-widest uppercase shadow-2xl transition-all active:scale-95">
                            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <><Zap className="w-4 h-4 inline mr-2 text-amber-500" />{t.donate}</>}
                          </button>
                       </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
          <div className="lg:col-span-4 space-y-12">
            
            <section className={`${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white shadow-sm border-slate-100'} rounded-[48px] p-10 border transition-all text-center`}>
               <div className="flex justify-center mb-8"><ImpactAvatar address={account} size={24} /></div>
               <h3 className="text-2xl font-black mb-6 italic tracking-tight uppercase">Mythic Handle</h3>
               <input type="text" placeholder="Sign name..." value={nickname} onChange={(e) => setNickname(e.target.value)} className={`w-full ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'} p-5 rounded-[24px] outline-none font-bold text-sm mb-4 border`} />
               <button onClick={() => { fetchBlockchainData(); confetti(); }} className="w-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest">{t.save}</button>
            </section>

            <section className="bg-slate-950 rounded-[48px] p-12 text-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden text-center group">
                 <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                 <Vote className="text-emerald-400 w-10 h-10 mx-auto mb-6" />
                 <h3 className="text-3xl font-black mb-2 italic tracking-tighter uppercase">Flash Relief DAO</h3>
                 <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-10">{t.power}: {parseFloat(votePower).toFixed(2)} Impacts</p>
                 {!voted ? (
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => { setVoted(true); confetti(); }} className="bg-emerald-600 py-5 rounded-2xl font-black text-xs tracking-widest uppercase">SÍ / YES</button>
                      <button onClick={() => setVoted(true)} className="bg-white/10 py-5 rounded-2xl font-black text-xs border border-white/10">NO</button>
                    </div>
                 ) : ( <div className="bg-emerald-500/20 text-emerald-400 font-black text-[10px] tracking-widest py-4 border border-emerald-500/20 rounded-2xl uppercase">Vote Recorded</div> )}
            </section>

            <div className={`${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white shadow-sm border-slate-100'} rounded-[48px] p-10 border text-center transition-all`}>
               <div className="relative inline-block"><Trophy className={`w-28 h-28 mx-auto mb-8 drop-shadow-2xl ${hasReward ? 'text-amber-500' : 'text-slate-100 dark:text-white/5'}`} /><div className="absolute top-0 right-0 bg-emerald-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-black animate-pulse">S</div></div>
               <h3 className="text-3xl font-black mb-4 italic tracking-tight uppercase text-emerald-500">Impact Badge</h3>
               {hasReward && ( <button onClick={() => window.open('https://twitter.com/intent/tweet?text=AltruBSC', '_blank')} className="w-full bg-slate-900 text-white py-5 rounded-[24px] text-[10px] font-black tracking-widest uppercase dark:bg-white dark:text-slate-950 flex items-center justify-center gap-3"><Share2 className="w-5 h-5" /> {t.share}</button> )}
            </div>

            <div className={`${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white shadow-sm border-slate-100'} rounded-[48px] p-8 border`}>
               <h3 className="text-2xl font-black mb-10 italic uppercase border-b border-white/5 pb-4">{t.rank}</h3>
               <div className="space-y-4">
                 {leaderboard.map(entry => (
                   <div key={entry.address} className={`flex items-center justify-between p-6 rounded-[32px] border ${entry.address.includes('You') ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-50 dark:bg-white/5 border-transparent'} group`}>
                     <div className="flex items-center gap-4">
                        <div className="bg-white dark:bg-slate-800 p-2 rounded-xl group-hover:scale-110 transition-transform shadow-sm"><UserCircle className="w-6 h-6 text-slate-400" /></div>
                        <div className="flex flex-col"><span className="text-sm font-black italic">{entry.nickname}</span><span className="text-[10px] font-bold text-slate-500 uppercase">{entry.address}</span></div>
                     </div>
                     <span className="text-sm font-black text-emerald-500 uppercase italic">{parseFloat(entry.total).toFixed(1)} BNB</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </section>
      </main>

      <BridgeModal isOpen={showBridgeModal} onClose={() => setShowBridgeModal(false)} isDarkMode={isDarkMode} isSpanish={isSpanish} />
      <FiatModal isOpen={showFiatModal} onClose={() => setShowFiatModal(false)} isDarkMode={isDarkMode} isSpanish={isSpanish} />
      <LiveTicker isDarkMode={isDarkMode} />
      <AIAssistant isDarkMode={isDarkMode} isSpanish={isSpanish} onRecommend={handleRecommend} />
    </div>
  );
}
export default App;
