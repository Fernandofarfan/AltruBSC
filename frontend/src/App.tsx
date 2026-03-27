import { useState, useEffect } from 'react';
import { HeartHandshake, Loader2, AlertTriangle, CheckCircle2, Trophy, Medal, Star, Share2, BarChart3, Building2, UserCircle, Vote, Moon, Sun, Zap } from 'lucide-react';
import { ethers } from 'ethers';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CONTRACT_ADDRESS, CONTRACT_ABI, USDT_ADDRESS, ERC20_ABI, REWARD_NFT_ADDRESS } from './contract';
import { generateCertificate } from './CertificateGenerator';
import { AIAssistant } from './AIAssistant';
import { ImpactMap } from './ImpactMap';
import { LiveTicker } from './LiveTicker';

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

const ANALYTICS_DATA = [
  { name: 'Week 1', total: 400 },
  { name: 'Week 2', total: 1200 },
  { name: 'Week 3', total: 2800 },
  { name: 'Week 4', total: 4500 },
];

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
  const [nickname, setNickname] = useState<string>('');
  const [showNGOPortal, setShowNGOPortal] = useState<boolean>(false);
  const [ngoName, setNgoName] = useState<string>('');
  const [voted, setVoted] = useState<boolean>(false);

  const checkNetwork = async () => {
    if (!(window as any).ethereum) return;
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const network = await provider.getNetwork();
    setNetworkOk(network.chainId === BigInt(31337));
  };

  const connectWallet = async () => {
    if ((window as any).ethereum) {
      try {
        setTxStatus("Requesting connection...");
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        await checkNetwork();
      } catch (error) { setTxStatus("Connection failed."); }
    } else { alert('Please install MetaMask'); }
  };

  const fixMetaMask = async () => {
    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7a69' }],
      });
      setNetworkOk(true);
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x7a69',
              chainName: 'Hardhat Local',
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['http://127.0.0.1:8545'],
            }],
          });
          setNetworkOk(true);
        } catch (addError) {}
      }
    }
    await connectWallet();
  };

  const fetchBlockchainData = async () => {
    try {
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const count = await contract.causeCount();
      const fetchedCauses: Cause[] = [];
      for (let i = 1; i <= Number(count); i++) {
        const cause = await contract.causes(i);
        const bnbBalance = await contract.causeBalances(i, ethers.ZeroAddress);
        const usdtBalance = await contract.causeBalances(i, USDT_ADDRESS);
        const updates = await contract.getCauseUpdates(i);
        const isToken = cause.name.includes("(USDT)");
        const raised = isToken ? ethers.formatUnits(usdtBalance, 18) : ethers.formatEther(bnbBalance);
        fetchedCauses.push({ id: Number(cause.id), name: cause.name, goalAmount: isToken ? ethers.formatUnits(cause.goalAmount, 18) : ethers.formatEther(cause.goalAmount), raised, ngo: cause.verifiedNGO, logo: isToken ? "🪙" : "🌊", isTokenCause: isToken, updates });
      }
      setCauses(fetchedCauses);
      if (account && networkOk) {
        const nftContract = new ethers.Contract(REWARD_NFT_ADDRESS, ["function balanceOf(address) view returns (uint256)"], provider);
        const balance = await nftContract.balanceOf(account);
        setHasReward(Number(balance) > 0);
        const donorInfo = await contract.donors(account);
        setVotePower(ethers.formatEther(donorInfo.totalDonated));
      }
      const userBnbBalance = account ? await provider.getBalance(account) : 0n;
      setLeaderboard([
        { address: "0xf39...2266", nickname: "Satoshi_Fan", total: "25.5", rank: 1 },
        { address: "0x709...79C8", nickname: "ImpactMaker", total: "12.2", rank: 2 },
        { address: account ? `${account.slice(0,5)}...${account.slice(-4)}` : "You", nickname: nickname || "AnonDonor", total: ethers.formatEther(userBnbBalance), rank: 3 }
      ]);
    } catch (error) { console.error(error); }
  };

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
        if (allowance < amount) { setTxStatus("Approving USDT..."); await (await usdt.approve(CONTRACT_ADDRESS, amount)).wait(); }
        setTxStatus(`Donating ${amountStr} USDT...`);
        await (await contract.donateTokenToCause(causeId, USDT_ADDRESS, amount)).wait();
      } else {
        setTxStatus(`Donating ${amountStr} BNB...`);
        await (await contract.donateToCause(causeId, { value: ethers.parseEther(amountStr) })).wait();
      }
      setTxStatus("SUCCESS!");
      confetti({ particleCount: 200, spread: 90 });
      const cause = causes.find(c => c.id === causeId);
      if (cause) generateCertificate(account, amountStr, isToken ? 'USDT' : 'BNB', cause.name);
      fetchBlockchainData();
    } catch (error: any) { setTxStatus(`Failed: ${error.reason || "Error"}`); } 
    finally { setProcessingId(null); setTimeout(() => setTxStatus(''), 5000); }
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent(`🌍 Acabo de realizar una donación en @AltruBSC para apoyar el impacto social real en la cadena. ¡Únete al cambio! #BSC #Hackathon #Altruism`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const registerNGO = async () => {
    if (!ngoName) return alert("Please enter NGO name");
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setTxStatus("Registering NGO...");
      await (await contract.registerNGO(account, ngoName)).wait();
      setTxStatus("NGO REGISTERED!");
      setShowNGOPortal(false);
      confetti();
      fetchBlockchainData();
    } catch (error: any) { setTxStatus(`Error: ${error.reason || "Failed"}`); } 
    finally { setTimeout(() => setTxStatus(''), 5000); }
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
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-[#f8fafc] text-slate-900'} font-sans selection:bg-emerald-100 pb-20 overflow-x-hidden transition-colors duration-500`}>
      
      {(!networkOk || !account) && (
        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="bg-slate-900 text-white px-8 flex flex-col md:flex-row items-center justify-between gap-6 sticky top-0 z-60 shadow-2xl border-b border-white/10 py-6 overflow-hidden">
          <div className="flex items-center gap-5">
            <div className="bg-amber-500/10 p-4 rounded-3xl border border-amber-500/20"><AlertTriangle className="text-amber-400 w-8 h-8 animate-pulse" /></div>
            <div>
              <p className="font-black text-lg tracking-tight uppercase">PLATINUM ACCESS REQUIRED</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">System ready. Connect with the 10,000 BNB Test Key.</p>
            </div>
          </div>
          <button onClick={fixMetaMask} className="bg-white text-slate-900 px-8 py-4 rounded-2xl text-xs font-black shadow-xl active:scale-95 transition-all">CONNECT PLATINUM</button>
        </motion.div>
      )}

      <AnimatePresence>
        {txStatus && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-12 left-1/2 -translate-x-1/2 z-100 bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border border-slate-700 max-w-lg w-full">
            {txStatus.includes("SUCCESS") ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />}
            <span className="text-sm font-black truncate uppercase tracking-widest">{txStatus}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className={`${isDarkMode ? 'bg-slate-900/50' : 'bg-white/80'} backdrop-blur-md border-b ${isDarkMode ? 'border-white/10' : 'border-slate-200'} sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-2xl shadow-lg shadow-emerald-100"><HeartHandshake className="text-white w-7 h-7" /></div>
            <span className="font-black text-2xl tracking-tighter">AltruBSC</span>
          </div>
          <div className="flex gap-4 items-center">
             <button onClick={() => setIsDarkMode(!isDarkMode)} className={`${isDarkMode ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'} p-3 rounded-2xl transition-all`}>
               {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>
             <button onClick={() => setShowNGOPortal(!showNGOPortal)} className={`hidden md:flex items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl`}>
               <Building2 className="w-4 h-4" /> Portal
             </button>
             {account ? (
              <div className={`flex items-center gap-3 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} p-1.5 pr-4 rounded-2xl border font-bold text-sm`}>
                <div className="bg-white p-2 rounded-xl shadow-sm"><UserCircle className="w-4 h-4 text-slate-400" /></div>
                {nickname || `${account.slice(0, 6)}...${account.slice(-4)}`}
              </div>
            ) : (
              <button onClick={connectWallet} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black transition-all">Connect</button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        
        <AnimatePresence>
          {showNGOPortal && (
             <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={`${isDarkMode ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200'} rounded-[40px] p-12 border shadow-xl overflow-hidden backdrop-blur-xl`}>
               <div className="max-w-2xl">
                 <h2 className="text-3xl font-black mb-4">NGO Registration</h2>
                 <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'} font-medium mb-12`}>Join the AltruBSC transparency network.</p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                   <div>
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Foundation Name</label>
                     <input type="text" placeholder="NGO Name" value={ngoName} onChange={(e) => setNgoName(e.target.value)} className={`w-full ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'} p-4 rounded-2xl outline-none font-bold`} />
                   </div>
                   <button onClick={registerNGO} className="bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black">REGISTER</button>
                 </div>
               </div>
             </motion.section>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <div className="lg:col-span-8 space-y-12">
            <ImpactMap isDarkMode={isDarkMode} />
            <section className={`${isDarkMode ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200'} rounded-[40px] p-12 shadow-sm border backdrop-blur-xl`}>
               <div className="flex items-center justify-between mb-12">
                 <div>
                    <div className="flex items-center gap-2 mb-2"><BarChart3 className="text-emerald-500 w-5 h-5" /><span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Live Metrics</span></div>
                    <h2 className="text-3xl font-black">Impact Distribution</h2>
                 </div>
               </div>
               <div className="h-[250px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={ANALYTICS_DATA}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#ffffff10" : "#e2e8f0"} />
                     <XAxis dataKey="name" hide />
                     <YAxis hide />
                     <Tooltip content={({ active, payload }) => {
                        if (active && payload && payload.length) return (<div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-700"><p className="text-sm font-black">${payload[0].value} USD</p></div>);
                        return null;
                     }} />
                     <Bar dataKey="total" radius={[8, 8, 8, 8]} barSize={40}>
                        {ANALYTICS_DATA.map((_, i) => (<Cell key={`cell-${i}`} fill={i === ANALYTICS_DATA.length - 1 ? '#10b981' : isDarkMode ? '#1e293b' : '#f1f5f9'} />))}
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {causes.map((cause) => {
                const progress = (Number(cause.raised) / Number(cause.goalAmount)) * 100;
                const isProcessing = processingId === cause.id;
                return (
                  <motion.div whileHover={{ scale: 1.02 }} key={cause.id} className={`${isDarkMode ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200'} rounded-[40px] shadow-sm border transition-all flex flex-col overflow-hidden backdrop-blur-xl`}>
                    <div className="p-8">
                       <div className="text-3xl mb-8">{cause.logo}</div>
                       <h3 className="text-xl font-black mb-4">{cause.name}</h3>
                       <div className="space-y-4">
                          <div className="flex justify-between font-black"><p>{cause.raised} {cause.isTokenCause ? 'USDT' : 'BNB'}</p><span>{Math.round(progress)}%</span></div>
                          <div className={`w-full ${isDarkMode ? 'bg-white/10' : 'bg-slate-100'} h-2 rounded-full overflow-hidden`}><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(progress, 100)}%` }} className="h-full bg-emerald-500" /></div>
                          <input type="number" step="0.01" value={donationAmounts[cause.id] || ''} onChange={(e) => setDonationAmounts({...donationAmounts, [cause.id]: e.target.value})} className={`w-full ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'} p-4 rounded-2xl outline-none`} placeholder="Amount" />
                          <button onClick={() => handleDonate(cause.id, cause.isTokenCause)} disabled={isProcessing} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-100">{isProcessing ? "Processing..." : "SECURE DONATION"}</button>
                       </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-12">
            
            <section className={`${isDarkMode ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200'} rounded-[40px] p-10 shadow-sm border backdrop-blur-xl`}>
               <div className="flex items-center gap-2 mb-4"><Zap className="text-amber-500 w-5 h-5" /><span className="text-[10px] font-black uppercase tracking-widest">Web3 Handle</span></div>
               <h3 className="text-2xl font-black mb-6">Profile Nickname</h3>
               <input type="text" placeholder="Set name..." value={nickname} onChange={(e) => setNickname(e.target.value)} className={`w-full ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'} p-4 rounded-2xl outline-none font-bold text-sm mb-4`} />
               <button onClick={() => { fetchBlockchainData(); confetti(); }} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase dark:bg-white dark:text-slate-900">Save</button>
            </section>

            <section className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden">
               <div className="relative z-10 text-center">
                 <div className="flex items-center justify-center gap-2 mb-4"><Vote className="text-emerald-400 w-5 h-5" /><span className="text-[10px] font-black uppercase tracking-widest">DAO Governance</span></div>
                 <h3 className="text-xl font-black mb-6">Emergency Aid #01</h3>
                 <p className="text-slate-400 text-sm mb-10">Power: {votePower} Impacts</p>
                 {!voted ? (
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => { setVoted(true); confetti(); }} className="bg-emerald-600 py-4 rounded-2xl font-black text-xs">YES</button>
                      <button onClick={() => setVoted(true)} className="bg-white/10 py-4 rounded-2xl font-black text-xs">NO</button>
                    </div>
                 ) : (
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-emerald-400 font-bold text-xs tracking-widest">VOTED</div>
                 )}
               </div>
            </section>

            <div className={`${isDarkMode ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200'} rounded-[40px] p-10 shadow-sm border text-center backdrop-blur-xl`}>
               <div className="bg-slate-50 w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center">
                 {hasReward ? <Trophy className="w-12 h-12 text-amber-500" /> : <Star className="w-12 h-12 text-slate-200" />}
               </div>
               <h3 className="text-2xl font-black mb-4">NFT Badge</h3>
               {hasReward && (
                 <button onClick={shareOnTwitter} className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-2 dark:bg-white dark:text-slate-900"><Share2 className="w-4 h-4" /> Share on X</button>
               )}
            </div>

            <div className={`${isDarkMode ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200'} rounded-[40px] p-8 shadow-sm border backdrop-blur-xl`}>
               <div className="flex items-center gap-3 mb-10"><Medal className="text-amber-500 w-6 h-6" /><h3 className="text-xl font-black tracking-tighter">Impact Ranking</h3></div>
               <div className="space-y-4">
                 {leaderboard.map(entry => (
                   <div key={entry.address} className={`flex items-center justify-between p-5 rounded-3xl border ${entry.address.includes('You') ? 'bg-emerald-500/10 border-emerald-500/20' : isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-50'}`}>
                     <div className="flex flex-col">
                        <span className="text-sm font-black">{entry.nickname}</span>
                        <span className="text-[10px] font-mono text-slate-500">{entry.address}</span>
                     </div>
                     <span className="text-sm font-black">{entry.total} BNB</span>
                   </div>
                 ))}
               </div>
            </div>

          </div>
        </div>
      </main>

      <LiveTicker isDarkMode={isDarkMode} />
      <AIAssistant isDarkMode={isDarkMode} />
    </div>
  );
}

export default App;
