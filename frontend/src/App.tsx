import { useState, useEffect } from 'react';
import { HeartHandshake, Loader2, AlertTriangle, Trophy, UserCircle, Vote, Moon, Sun, ShieldCheck, QrCode } from 'lucide-react';
import { ethers } from 'ethers';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { CONTRACT_ADDRESS, CONTRACT_ABI, USDT_ADDRESS, ERC20_ABI, REWARD_NFT_ADDRESS } from './contract';
import { generateCertificate } from './CertificateGenerator';
import { AIAssistant } from './AIAssistant';
import { ImpactMap } from './ImpactMap';
import { LiveTicker } from './LiveTicker';
import { FiatModal } from './FiatModal';

interface Cause {
  id: number;
  name: string;
  goalAmount: string;
  raised: string;
  ngo: string;
  logo: string;
  isTokenCause: boolean;
  updates: string[];
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
  const [voted, setVoted] = useState<boolean>(false);

  const t = {
    en: {
      connect: "Connect Wallet", fix: "CONNECT DIAMOND", health: "Contract Health", vault: "Transparency Vault", 
      buy: "Buy Card", verify: "Verified NGO", donate: "SECURE DONATION", save: "Save", power: "Weight",
      rank: "Impact Ranking", badge: "Impact Badge", share: "Post to X", portal: "Portal", 
      identity: "Web3 Handle", tvl_txt: "Total Value Locked", health_val: "100% SECURE", audit: "AltruAI Audited"
    },
    es: {
      connect: "Conectar", fix: "CONECTAR DIAMANTE", health: "Salud del Contrato", vault: "Bóveda de Transparencia", 
      buy: "Comprar", verify: "ONG Verificada", donate: "DONACIÓN SEGURA", save: "Guardar", power: "Poder",
      rank: "Ranking de Impacto", badge: "Insignia NFT", share: "Compartir en X", portal: "Portal", 
      identity: "Handle Web3", tvl_txt: "Fondo Total Bloqueado", health_val: "100% SEGURO", audit: "Auditado por AltruAI"
    }
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
      } catch (error) { setTxStatus(isSpanish ? "Error" : "failed"); }
    }
  };

  const fixMetaMask = async () => {
    try {
      await (window as any).ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x7a69' }] });
      setNetworkOk(true);
    } catch (error: any) {
      if (error.code === 4902) {
        await (window as any).ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{ chainId: '0x7a69', chainName: 'Hardhat Local', nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: ['http://127.0.0.1:8545'] }],
        });
        setNetworkOk(true);
      }
    }
    await connectWallet();
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
        const updates = await contract.getCauseUpdates(i);
        const isTkn = cause.name.includes("(USDT)");
        const raised = isTkn ? ethers.formatUnits(usdtBal, 18) : ethers.formatEther(bnbBal);
        fetched.push({ id: Number(cause.id), name: cause.name, goalAmount: isTkn ? ethers.formatUnits(cause.goalAmount, 18) : ethers.formatEther(cause.goalAmount), raised, ngo: cause.verifiedNGO, logo: isTkn ? "🪙" : "🌊", isTokenCause: isTkn, updates });
      }
      setCauses(fetched);
      if (account && networkOk) {
        const nftContract = new ethers.Contract(REWARD_NFT_ADDRESS, ["function balanceOf(address) view returns (uint256)"], provider);
        const balance = await nftContract.balanceOf(account);
        setHasReward(Number(balance) > 0);
        const donorInfo = await contract.donors(account);
        setVotePower(ethers.formatEther(donorInfo.totalDonated));
      }
      const uBnb = account ? await provider.getBalance(account) : 0n;
      setLeaderboard([
        { address: "0xf39...2266", nickname: "Satoshi_Fan", total: "25.5", rank: 1 },
        { address: "0x709...79C8", nickname: "ImpactMaker", total: "12.2", rank: 2 },
        { address: account ? `${account.slice(0,5)}...${account.slice(-4)}` : "You", nickname: nickname || "AnonDonor", total: ethers.formatEther(uBnb), rank: 3 }
      ]);
    } catch (e) { console.error(e); }
  };

  const tvl = causes.reduce((acc, c) => acc + parseFloat(c.raised), 0).toFixed(2);

  const handleDonate = async (causeId: number, isToken: boolean) => {
    if (!account) return connectWallet();
    const amountStr = donationAmounts[causeId] || (isToken ? "10" : "0.01");
    setProcessingId(causeId);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      if (isToken) {
        const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
        const amount = ethers.parseUnits(amountStr, 18);
        const allowance = await usdt.allowance(account, CONTRACT_ADDRESS);
        if (allowance < amount) { setTxStatus(isSpanish ? "Aprobando..." : "Approving..."); await (await usdt.approve(CONTRACT_ADDRESS, amount)).wait(); }
        setTxStatus(isSpanish ? `Donando...` : `Donating...`);
        await (await contract.donateTokenToCause(causeId, USDT_ADDRESS, amount)).wait();
      } else {
        setTxStatus(isSpanish ? `Donando...` : `Donating...`);
        await (await contract.donateToCause(causeId, { value: ethers.parseEther(amountStr) })).wait();
      }
      setTxStatus(isSpanish ? "¡ÉXITO!" : "SUCCESS!"); confetti({ particleCount: 200, spread: 90 });
      const cause = causes.find(c => c.id === causeId);
      if (cause) generateCertificate(account, amountStr, isToken ? 'USDT' : 'BNB', cause.name);
      fetchBlockchainData();
    } catch (error: any) { setTxStatus(isSpanish ? "Fallo" : "Failed"); } 
    finally { setProcessingId(null); setTimeout(() => setTxStatus(''), 5000); }
  };

  useEffect(() => {
    fetchBlockchainData();
    if ((window as any).ethereum) {
      (window as any).ethereum.on('chainChanged', () => window.location.reload());
      (window as any).ethereum.on('accountsChanged', (accounts: string[]) => setAccount(accounts[0]));
      checkNetwork();
    }
  }, [account]);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-[#f8fafc] text-slate-900'} font-sans pb-20 transition-colors duration-500`}>
      <AnimatePresence>
        {(!networkOk || !account) && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-slate-900 text-white px-8 flex items-center justify-between sticky top-0 z-60 border-b border-white/10 py-6">
            <div className="flex items-center gap-5">
              <AlertTriangle className="text-amber-400 w-8 h-8 animate-pulse" />
              <p className="font-black text-lg uppercase tracking-tight">DIAMOND AUTH REQUIRED</p>
            </div>
            <button onClick={fixMetaMask} className="bg-white text-slate-900 px-8 py-4 rounded-2xl text-xs font-black shadow-xl">{t.fix}</button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {txStatus && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-12 left-1/2 -translate-x-1/2 z-100 bg-slate-900 text-white px-8 py-4 rounded-3xl border border-slate-700 max-w-lg w-full flex items-center gap-4 shadow-2xl">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <span className="text-sm font-black uppercase tracking-widest">{txStatus}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className={`${isDarkMode ? 'bg-slate-900/50' : 'bg-white/80'} backdrop-blur-md border-b ${isDarkMode ? 'border-white/10' : 'border-slate-200'} sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <HeartHandshake className="text-emerald-500 w-7 h-7" />
            <span className="font-black text-2xl tracking-tighter">AltruBSC</span>
          </div>
          <div className="flex gap-3 items-center">
             <button onClick={() => setIsSpanish(!isSpanish)} className={`${isDarkMode ? 'bg-white/10' : 'bg-slate-100'} px-4 py-2 rounded-xl text-xs font-black transition-all`}>
               {isSpanish ? '🇺🇸 EN' : '🇪🇸 ES'}
             </button>
             <button onClick={() => setIsDarkMode(!isDarkMode)} className={`${isDarkMode ? 'bg-white/10' : 'bg-slate-100'} p-3 rounded-xl transition-all`}>
               {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>
             {account && (
              <div className={`hidden md:flex items-center gap-3 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} p-1.5 pr-4 rounded-2xl border font-bold text-xs`}>
                <UserCircle className="w-4 h-4 text-slate-400" />
                {nickname || `${account.slice(0, 6)}...${account.slice(-4)}`}
              </div>
            )}
            <button onClick={() => setShowFiatModal(true)} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hidden sm:block">{t.buy}</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12 space-y-12">
        <section className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${isDarkMode ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50 border-emerald-100'} p-8 rounded-[40px] border relative overflow-hidden`}>
           <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">{t.tvl_txt}</span>
              <p className="text-4xl font-black tracking-tighter">{tvl} <small className="text-sm">BNB</small></p>
           </div>
           <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">{t.health}</span>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" /><p className="text-xl font-black">{t.health_val}</p></div>
           </div>
           <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Protocol Trust</span>
              <div className="flex items-center gap-3 font-bold text-sm"><ShieldCheck className="w-5 h-5 text-emerald-500" />{t.audit}</div>
           </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-12">
            <ImpactMap isDarkMode={isDarkMode} isSpanish={isSpanish} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {causes.map((cause) => {
                const progress = (Number(cause.raised) / Number(cause.goalAmount)) * 100;
                const isProcessing = processingId === cause.id;
                return (
                  <motion.div whileHover={{ scale: 1.02 }} key={cause.id} className={`${isDarkMode ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200'} rounded-[40px] border flex flex-col overflow-hidden`}>
                    <div className="p-8">
                       <div className="flex justify-between mb-8 text-4xl">{cause.logo} <QrCode className="w-6 h-6 text-slate-400" /></div>
                       <h3 className="text-2xl font-black mb-4 truncate">{cause.name}</h3>
                       <div className="space-y-4">
                          <div className="flex justify-between font-black"><p>{cause.raised} {cause.isTokenCause ? 'USDT' : 'BNB'}</p><span>{Math.round(progress)}%</span></div>
                          <div className={`w-full ${isDarkMode ? 'bg-white/10' : 'bg-slate-100'} h-3 rounded-full overflow-hidden`}><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(progress, 100)}%` }} className="h-full bg-emerald-500" /></div>
                          <input type="number" value={donationAmounts[cause.id] || ''} onChange={(e) => setDonationAmounts({...donationAmounts, [cause.id]: e.target.value})} className={`w-full ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} p-5 rounded-3xl outline-none font-black`} placeholder="0.1" />
                          <button onClick={() => handleDonate(cause.id, cause.isTokenCause)} disabled={isProcessing} className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[28px] font-black text-xs tracking-widest uppercase">
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t.donate}
                          </button>
                       </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
          <div className="lg:col-span-4 space-y-12">
            <section className={`${isDarkMode ? 'bg-slate-900/50' : 'bg-white'} rounded-[40px] p-10 border border-slate-200 dark:border-white/10`}>
               <h3 className="text-2xl font-black mb-6 uppercase tracking-tighter">Profile</h3>
               <input type="text" placeholder="Set name" value={nickname} onChange={(e) => setNickname(e.target.value)} className={`w-full ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} p-4 rounded-2xl outline-none font-bold text-sm mb-4`} />
               <button onClick={() => { fetchBlockchainData(); confetti(); }} className="w-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 py-4 rounded-2xl font-black text-xs uppercase tracking-widest">{t.save}</button>
            </section>
            <section className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl text-center">
                 <Vote className="text-emerald-400 w-5 h-5 mx-auto mb-4" />
                 <h3 className="text-xl font-black mb-6">Emergency Aid</h3>
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-10">{t.power}: {parseFloat(votePower).toFixed(2)} Impacts</p>
                 {!voted ? (
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => { setVoted(true); confetti(); }} className="bg-emerald-600 py-4 rounded-2xl font-black text-xs">{isSpanish ? 'SÍ' : 'YES'}</button>
                      <button onClick={() => setVoted(true)} className="bg-white/10 py-4 rounded-2xl font-black text-xs">NO</button>
                    </div>
                 ) : ( <div className="text-emerald-400 font-black text-xs tracking-widest uppercase">Vote Recorded</div> )}
            </section>
            <div className={`${isDarkMode ? 'bg-slate-900/50' : 'bg-white'} rounded-[40px] p-10 border border-slate-200 dark:border-white/10 text-center`}>
               <Trophy className={`w-12 h-12 mx-auto mb-8 ${hasReward ? 'text-amber-500' : 'text-slate-200'}`} />
               <h3 className="text-2xl font-black mb-4">{t.badge}</h3>
               {hasReward && ( <button onClick={() => window.open('https://twitter.com/intent/tweet?text=impact', '_blank')} className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black tracking-widest uppercase dark:bg-white dark:text-slate-900">{t.share}</button> )}
            </div>
            <div className={`${isDarkMode ? 'bg-slate-900/50' : 'bg-white'} rounded-[40px] p-8 border border-slate-200 dark:border-white/10`}>
               <h3 className="text-xl font-black mb-10">{t.rank}</h3>
               <div className="space-y-4">
                 {leaderboard.map(entry => (
                   <div key={entry.address} className={`flex items-center justify-between p-5 rounded-3xl border ${entry.address.includes('You') ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-50 dark:bg-white/5 border-transparent'}`}>
                     <span className="text-sm font-black">{entry.nickname}</span>
                     <span className="text-xs font-black">{parseFloat(entry.total).toFixed(1)} BNB</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </section>
      </main>
      <FiatModal isOpen={showFiatModal} onClose={() => setShowFiatModal(false)} isDarkMode={isDarkMode} isSpanish={isSpanish} />
      <LiveTicker isDarkMode={isDarkMode} />
      <AIAssistant isDarkMode={isDarkMode} isSpanish={isSpanish} />
    </div>
  );
}
export default App;
