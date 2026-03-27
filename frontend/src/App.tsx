import { useState, useEffect } from 'react';
import { HeartHandshake, TrendingUp, Loader2, AlertTriangle, CheckCircle2, Trophy, Medal, Star, Share2, ImageIcon, History, BarChart3, Building2, UserCircle, Download, Vote } from 'lucide-react';
import { ethers } from 'ethers';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CONTRACT_ADDRESS, CONTRACT_ABI, USDT_ADDRESS, ERC20_ABI, REWARD_NFT_ADDRESS } from './contract';
import { generateCertificate } from './CertificateGenerator';
import { AIAssistant } from './AIAssistant';
import { ImpactMap } from './ImpactMap';

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
  
  const [showNGOPortal, setShowNGOPortal] = useState<boolean>(false);
  const [ngoName, setNgoName] = useState<string>('');
  const [registeringNGO, setRegisteringNGO] = useState<boolean>(false);
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
      } catch (error) {
        setTxStatus("Connection failed.");
      }
    } else {
      alert('Please install MetaMask');
    }
  };

  const switchNetwork = async () => {
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
  };

  const fixMetaMask = async () => {
    await switchNetwork();
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
        
        fetchedCauses.push({
          id: Number(cause.id),
          name: cause.name,
          goalAmount: isToken ? ethers.formatUnits(cause.goalAmount, 18) : ethers.formatEther(cause.goalAmount),
          raised: raised,
          ngo: cause.verifiedNGO,
          logo: isToken ? "🪙" : "🌊",
          isTokenCause: isToken,
          updates: updates
        });
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
        { address: "0xf39...2266", total: "25.5", rank: 1 },
        { address: "0x709...79C8", total: "12.2", rank: 2 },
        { address: account ? `${account.slice(0,5)}...${account.slice(-4)}` : "You", total: ethers.formatEther(userBnbBalance), rank: 3 }
      ]);

    } catch (error) {
      console.error(error);
    }
  };

  const handleDonate = async (causeId: number, isToken: boolean) => {
    if (!account) return connectWallet();
    if (!networkOk) return switchNetwork();
    
    const amountStr = donationAmounts[causeId] || (isToken ? "10" : "0.01");
    if (parseFloat(amountStr) <= 0) return alert("Please enter a valid amount");

    setProcessingId(causeId);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      if (isToken) {
        const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
        const amount = ethers.parseUnits(amountStr, 18);
        const allowance = await usdt.allowance(account, CONTRACT_ADDRESS);
        if (allowance < amount) {
          setTxStatus("Approving USDT...");
          await (await usdt.approve(CONTRACT_ADDRESS, amount)).wait();
        }
        setTxStatus(`Donating ${amountStr} USDT...`);
        await (await contract.donateTokenToCause(causeId, USDT_ADDRESS, amount)).wait();
      } else {
        setTxStatus(`Donating ${amountStr} BNB...`);
        await (await contract.donateToCause(causeId, { value: ethers.parseEther(amountStr) })).wait();
      }
      
      setTxStatus("SUCCESS!");
      confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } });
      const cause = causes.find(c => c.id === causeId);
      if (cause) generateCertificate(account, amountStr, isToken ? 'USDT' : 'BNB', cause.name);
      fetchBlockchainData();
    } catch (error: any) {
      setTxStatus(`Failed: ${error.reason || "Error"}`);
    } finally {
      setProcessingId(null);
      setTimeout(() => setTxStatus(''), 5000);
    }
  };

  const registerNGO = async () => {
    if (!ngoName) return alert("Please enter NGO name");
    setRegisteringNGO(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      setTxStatus("Registering NGO...");
      const tx = await contract.registerNGO(account, ngoName);
      await tx.wait();
      setTxStatus("NGO REGISTERED!");
      setShowNGOPortal(false);
      confetti({ colors: ['#10b981', '#ffffff'] });
    } catch (error: any) {
       setTxStatus(`Error: ${error.reason || "Registration failed"}`);
    } finally {
      setRegisteringNGO(false);
      setTimeout(() => setTxStatus(''), 5000);
    }
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-emerald-100 pb-20 overflow-x-hidden">
      
      {/* ELITE Meta Setup Helper */}
      {(!networkOk || !account || (account && leaderboard.find(e => e.address.includes('You'))?.total === '0.0')) && (
        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="bg-slate-900 text-white px-8 flex flex-col md:flex-row items-center justify-between gap-6 sticky top-0 z-60 shadow-2xl border-b border-white/10 py-6 overflow-hidden">
          <div className="flex items-center gap-5 max-w-xl">
            <div className="bg-amber-500/10 p-4 rounded-3xl border border-amber-500/20"><AlertTriangle className="text-amber-400 w-8 h-8 animate-pulse" /></div>
            <div>
              <p className="font-black text-lg text-white mb-1 tracking-tight">DASHBOARD SETUP REQUIRED</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Connect to the account with **10,000 BNB** to show impact.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
             <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center gap-3 w-full sm:w-auto">
               <code className="text-[10px] text-emerald-400 font-bold">Key: 0x5de4...365a</code>
               <button 
                onClick={() => {
                  navigator.clipboard.writeText("0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a");
                  alert("✅ KEY COPIED!");
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-xl text-[10px] font-black transition-all"
               >COPY KEY</button>
             </div>
             <button onClick={fixMetaMask} className="bg-white text-slate-900 px-8 py-4 rounded-2xl text-xs font-black shadow-xl active:scale-95 transition-all">FIX METAMASK</button>
          </div>
        </motion.div>
      )}

      {/* ELITE Transaction Hud */}
      <AnimatePresence>
        {txStatus && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-100 bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border border-slate-700 max-w-lg w-full">
            {txStatus.includes("SUCCESS") || txStatus.includes("REGISTERED") ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />}
            <span className="text-sm font-bold truncate tracking-tight">{txStatus}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-2xl shadow-lg shadow-emerald-100"><HeartHandshake className="text-white w-7 h-7" /></div>
            <span className="font-black text-2xl tracking-tighter">AltruBSC</span>
          </div>
          <div className="flex gap-4">
             <button onClick={() => setShowNGOPortal(!showNGOPortal)} className="hidden md:flex items-center gap-2 text-slate-600 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl transition-all">
               <Building2 className="w-4 h-4" /> NGO Portal
             </button>
             {account ? (
              <div className="flex items-center gap-3 bg-slate-50 p-1.5 pr-4 rounded-2xl border border-slate-200 font-bold text-sm">
                <div className="bg-white p-2 rounded-xl shadow-sm"><UserCircle className="w-4 h-4 text-slate-400" /></div>
                {`${account.slice(0, 6)}...${account.slice(-4)}`}
              </div>
            ) : (
              <button onClick={connectWallet} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black transition-all shadow-xl">Connect</button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        
        {/* NGO Portal View */}
        <AnimatePresence>
          {showNGOPortal && (
             <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-white rounded-[40px] p-12 border border-slate-200 shadow-xl overflow-hidden relative">
               <div className="max-w-2xl">
                 <h2 className="text-3xl font-black mb-4">Official NGO Registration</h2>
                 <p className="text-slate-500 font-medium mb-12 leaging-relaxed">Are you an impactful organization? Register on-chain to start verified fundraising pools.</p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                   <div>
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Foundation Name</label>
                     <input type="text" placeholder="e.g. Save the Oceans" value={ngoName} onChange={(e) => setNgoName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold" />
                   </div>
                   <button onClick={registerNGO} disabled={registeringNGO} className="bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black transition-all active:scale-95 disabled:opacity-50">REGISTER NGO</button>
                 </div>
               </div>
             </motion.section>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <div className="lg:col-span-8 space-y-12">
            
            {/* ELITE Global Impact Map */}
            <ImpactMap />

            {/* Performance Analytics */}
            <section className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-slate-200">
               <div className="flex items-center justify-between mb-12">
                 <div>
                    <div className="flex items-center gap-2 mb-2"><BarChart3 className="text-emerald-500 w-5 h-5" /><span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Global Insights</span></div>
                    <h2 className="text-3xl font-black">Performance Analytics</h2>
                 </div>
                 <div className="text-right hidden sm:block">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Community Value</p>
                   <p className="text-2xl font-black text-slate-900 tracking-tighter">$124,500.00 USD</p>
                 </div>
               </div>
               <div className="h-[250px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={ANALYTICS_DATA}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
                     <YAxis hide />
                     <Tooltip cursor={{ fill: 'transparent' }} content={({ active, payload }) => {
                        if (active && payload && payload.length) return (<div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl border border-slate-700"><p className="text-[10px] font-black uppercase tracking-widest mb-1">{payload[0].payload.name}</p><p className="text-sm font-black">${payload[0].value} USD</p></div>);
                        return null;
                     }} />
                     <Bar dataKey="total" radius={[8, 8, 8, 8]} barSize={40}>
                        {ANALYTICS_DATA.map((_, i) => (<Cell key={`cell-${i}`} fill={i === ANALYTICS_DATA.length - 1 ? '#10b981' : '#f1f5f9'} />))}
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </section>

            {/* Causes Grid */}
            <div className="flex justify-between items-end mb-8">
              <h2 className="text-3xl font-black tracking-tight">Active Donation Pools</h2>
              <button onClick={() => { navigator.share ? navigator.share({ text: "Join the impact on AltruBSC!", url: window.location.href }) : alert("Shared!"); }} className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-3 rounded-2xl text-xs font-black hover:bg-slate-50 transition-all"><Share2 className="w-4 h-4" /> SHARE PLATFORM</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {causes.map((cause) => {
                const progress = (Number(cause.raised) / Number(cause.goalAmount)) * 100;
                const isProcessing = processingId === cause.id;
                return (
                  <motion.div whileHover={{ y: -5 }} key={cause.id} className="bg-white rounded-[40px] shadow-sm border border-slate-200 transition-all flex flex-col overflow-hidden">
                    <div className="p-8">
                      <div className="flex items-center justify-between mb-8">
                        <div className="text-3xl bg-slate-50 p-5 rounded-2xl">{cause.logo}</div>
                        <div className="flex flex-col items-end"><span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg uppercase tracking-tight mb-2">Cause #{cause.id}</span><span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-lg uppercase tracking-tight">Verified NGO</span></div>
                      </div>
                      <h3 className="text-2xl font-black mb-8 leading-tight h-16">{cause.name}</h3>
                      <div className="space-y-6">
                        <div className="flex justify-between items-end"><p className="text-4xl font-black tracking-tighter">{cause.raised} <span className="text-sm font-bold text-slate-400">{cause.isTokenCause ? 'USDT' : 'BNB'}</span></p><span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">{Math.round(progress)}%</span></div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(progress, 100)}%` }} className="h-full bg-emerald-500" /></div>
                        <div className="space-y-3 pt-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">Donate Amount</label>
                          <div className="relative">
                            <input type="number" step="0.01" value={donationAmounts[cause.id] || ''} onChange={(e) => setDonationAmounts({...donationAmounts, [cause.id]: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-5 rounded-3xl text-sm font-black focus:ring-2 focus:ring-emerald-500 outline-none" placeholder={cause.isTokenCause ? "10" : "0.01"} />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2"><TrendingUp className="w-3 h-3 text-emerald-500" /><span className="text-[10px] font-black text-emerald-600">≈ ${(parseFloat(donationAmounts[cause.id] || '0') * (cause.isTokenCause ? 1 : 2500)).toFixed(2)} USD</span></div>
                          </div>
                        </div>
                        <button onClick={() => handleDonate(cause.id, cause.isTokenCause)} disabled={isProcessing} className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[32px] font-black text-sm shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">{isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "SECURE DONATION"}</button>
                      </div>
                    </div>
                    {cause.updates.length > 0 && (
                      <div className="bg-slate-50 px-8 py-6 border-t border-slate-200 space-y-4">
                        <div className="flex items-center gap-2"><ImageIcon className="w-3 h-3 text-slate-400" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Impact Gallery</span></div>
                        {cause.updates.map((update, idx) => (<div key={idx} className="bg-white p-4 rounded-2xl border border-white flex gap-3"><History className="w-4 h-4 text-emerald-500 shrink-0" /><p className="text-xs font-bold text-slate-600 leading-relaxed">{update}</p></div>))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-12">
            
            {/* ELITE DAO Governance */}
            <section className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8"><Vote className="w-16 h-16 text-white opacity-5" /></div>
               <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-4"><Vote className="text-emerald-400 w-5 h-5" /><span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Governance Proposal</span></div>
                 <h3 className="text-2xl font-black mb-6">#01 Brazil Flood Relief Fund</h3>
                 <p className="text-slate-400 text-sm mb-10 leading-relaxed">Should AltruBSC deploy 10 BNB to the Brazil Flood Relief project? **Your Voting Power: {votePower} Impacts**</p>
                 {!voted ? (
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => { setVoted(true); confetti(); }} className="bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl font-black text-xs transition-all uppercase">YES</button>
                      <button onClick={() => setVoted(true)} className="bg-white/10 hover:bg-white/20 py-4 rounded-2xl font-black text-xs transition-all uppercase border border-white/10">NO</button>
                    </div>
                 ) : (
                    <div className="bg-white/5 p-4 rounded-2xl text-center"><p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">VOTE RECORDED IN BLOCKCHAIN</p></div>
                 )}
               </div>
            </section>

            {/* Achievement Card */}
            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-200 text-center relative overflow-hidden group">
               <div className="bg-slate-50 w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center border border-slate-100">
                 {hasReward ? <Trophy className="w-12 h-12 text-amber-500" /> : <Star className="w-12 h-12 text-slate-200" />}
               </div>
               <h3 className="text-2xl font-black mb-4">NFT Impact Badge</h3>
               <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">Donate over 0.5 BNB to unlock your verifiable proof-of-impact reward.</p>
               {hasReward ? (
                 <div className="flex flex-col gap-3">
                   <div className="bg-emerald-600 text-white py-3 rounded-2xl text-[10px] font-black tracking-widest uppercase shadow-lg shadow-emerald-100">IMPACT MAKER BADGE</div>
                   <button onClick={() => alert("Check gallery")} className="flex items-center justify-center gap-2 text-slate-400 hover:text-slate-900 text-[10px] font-black uppercase tracking-widest transition-all"><Download className="w-4 h-4" /> Get Certificate</button>
                 </div>
               ) : (
                 <div className="bg-slate-100 py-4 rounded-2xl text-slate-400 text-[10px] font-black uppercase tracking-widest">Tier: Bronze Supporter</div>
               )}
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-200">
               <div className="flex items-center gap-3 mb-10"><Medal className="text-amber-500 w-6 h-6" /><h3 className="text-xl font-black tracking-tight">Impact Ranking</h3></div>
               <div className="space-y-4">
                 {leaderboard.map(entry => (
                   <div key={entry.address} className={`flex items-center justify-between p-5 rounded-3xl border ${entry.address.includes('You') ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-50'}`}>
                     <div className="flex items-center gap-4">
                       <span className="text-[10px] font-black text-slate-300">#0{entry.rank}</span>
                       <span className="text-sm font-mono font-bold text-slate-600">{entry.address}</span>
                     </div>
                     <span className="text-sm font-black text-slate-900">{parseFloat(entry.total).toFixed(2)} BNB</span>
                   </div>
                 ))}
               </div>
            </div>

          </div>
        </div>
      </main>

      {/* ELITE AI Assistant */}
      <AIAssistant />
    </div>
  );
}

export default App;
