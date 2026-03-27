import { useState, useEffect } from 'react';
import { Wallet, HeartHandshake, ShieldCheck, TrendingUp, Download, Bell, Coins, Loader2, AlertTriangle, CheckCircle2, Trophy, Medal, Star, Share2, ImageIcon, History } from 'lucide-react';
import { ethers } from 'ethers';
import confetti from 'canvas-confetti';
import { CONTRACT_ADDRESS, CONTRACT_ABI, USDT_ADDRESS, ERC20_ABI, REWARD_NFT_ADDRESS, NFT_ABI } from './contract';

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

interface Activity {
  id: string;
  donor: string;
  amount: string;
  token: string;
  time: string;
}

interface LeaderboardEntry {
  address: string;
  total: string;
  rank: number;
}

function App() {
  const [account, setAccount] = useState<string>('');
  const [causes, setCauses] = useState<Cause[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [networkOk, setNetworkOk] = useState<boolean>(true);
  const [txStatus, setTxStatus] = useState<string>('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [hasReward, setHasReward] = useState<boolean>(false);
  const [donationAmounts, setDonationAmounts] = useState<Record<number, string>>({});

  const checkNetwork = async () => {
    if (!(window as any).ethereum) return;
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const network = await provider.getNetwork();
    setNetworkOk(network.chainId === BigInt(31337));
  };

  const connectWallet = async () => {
    if ((window as any).ethereum) {
      try {
        setTxStatus("Requesting account connection...");
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        await checkNetwork();
        setTxStatus("Wallet connected.");
      } catch (error) {
        console.error(error);
        setTxStatus("Connection failed.");
      }
    } else {
      alert('Please install MetaMask');
    }
  };

  const switchNetwork = async () => {
    try {
      setTxStatus("Requesting network switch...");
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7a69' }],
      });
      setNetworkOk(true);
      setTxStatus("Network switched successfully.");
    } catch (error: any) {
      if (error.code === 4902) {
        setTxStatus("Adding Hardhat network...");
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
        } catch (addError) {
          setTxStatus("Failed to add network.");
        }
      } else {
        setTxStatus("Network switch failed.");
      }
    }
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
      }

      setLeaderboard([
        { address: "0xf39...2266", total: "25.5", rank: 1 },
        { address: "0x709...79C8", total: "12.2", rank: 2 },
        { address: account ? `${account.slice(0,5)}...${account.slice(-4)}` : "You", total: "0.2", rank: 3 }
      ]);

    } catch (error) {
      console.error("Error fetching:", error);
    } finally {
      setLoading(false);
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
        setTxStatus(`Checking USDT allowance for ${amountStr}...`);
        const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
        const amount = ethers.parseUnits(amountStr, 18);
        
        const allowance = await usdt.allowance(account, CONTRACT_ADDRESS);
        if (allowance < amount) {
          setTxStatus("Applying approval...");
          const approveTx = await usdt.approve(CONTRACT_ADDRESS, amount);
          await approveTx.wait();
        }
        
        setTxStatus(`Donating ${amountStr} USDT...`);
        const tx = await contract.donateTokenToCause(causeId, USDT_ADDRESS, amount);
        await tx.wait();
      } else {
        setTxStatus(`Donating ${amountStr} BNB...`);
        const tx = await contract.donateToCause(causeId, { value: ethers.parseEther(amountStr) });
        await tx.wait();
      }
      
      setTxStatus("DONATION SUCCESSFUL!");
      confetti({
        particleCount: 200,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#ffffff', '#fbbf24']
      });
      fetchBlockchainData();
    } catch (error: any) {
      setTxStatus(`Error: ${error.reason || "Transaction failed"}`);
    } finally {
      setProcessingId(null);
      setTimeout(() => setTxStatus(''), 5000);
    }
  };

  const handleShare = () => {
    const text = `I just supported a cause on AltruBSC! 🌍\nHelp us bridge transparency to every impact. #SocialGood #Web3 #BSC`;
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: 'AltruBSC Impact', text, url });
    } else {
      alert("Coppied to clipboard: " + text);
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-emerald-100 pb-20">
      {!networkOk && account && (
        <div className="bg-rose-600 text-white py-3 px-4 text-center font-bold flex items-center justify-center gap-3 animate-pulse sticky top-0 z-60">
          <AlertTriangle className="w-5 h-5" />
          Switch to Hardhat Local (Chain ID 31337)
          <button onClick={switchNetwork} className="bg-white text-rose-600 px-3 py-1 rounded-lg text-xs hover:bg-rose-50 transition-colors ml-4">
            Switch Network
          </button>
        </div>
      )}

      {txStatus && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-100 bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 animate-slide-up border border-slate-700 max-w-lg w-full">
          {txStatus.includes("SUCCESS") ? (
             <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          ) : (
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin shrink-0" />
          )}
          <span className="text-sm font-bold tracking-tight truncate">{txStatus}</span>
        </div>
      )}

      {/* Navbar with Rewards Indicator */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-linear-to-br from-emerald-500 to-teal-600 p-2 rounded-2xl shadow-lg shadow-emerald-100">
                <HeartHandshake className="text-white w-7 h-7" />
              </div>
              <span className="font-black text-2xl tracking-tighter text-slate-900">AltruBSC</span>
            </div>
            <div className="flex items-center gap-4">
              {hasReward && (
                <div className="hidden md:flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 text-amber-700 font-bold text-xs animate-bounce">
                  <Medal className="w-4 h-4" />
                  IMPACT MAKER
                </div>
              )}
              {account ? (
                <div className="flex items-center gap-3 bg-slate-50 p-1.5 pr-4 rounded-2xl border border-slate-200">
                  <div className="bg-white p-2 rounded-xl shadow-sm"><Wallet className="w-4 h-4 text-slate-600" /></div>
                  <span className="text-sm font-bold">{`${account.slice(0, 6)}...${account.slice(-4)}`}</span>
                </div>
              ) : (
                <button onClick={connectWallet} className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-xl">
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content: Causes */}
          <div className="lg:col-span-8">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Active Fundraising Pools</h1>
                <p className="text-slate-500 font-medium tracking-tight">Donate from 1 USD to infinity. Real-time proof included.</p>
              </div>
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-black hover:bg-slate-50 transition-all text-slate-600"
              >
                <Share2 className="w-4 h-4" />
                SHARE IMPACT
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {causes.map((cause) => {
                const progress = (Number(cause.raised) / Number(cause.goalAmount)) * 100;
                const isProcessing = processingId === cause.id;
                
                return (
                  <div key={cause.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl transition-all flex flex-col group overflow-hidden">
                    <div className="p-8">
                      <div className="flex items-center justify-between mb-8">
                        <div className="text-3xl bg-slate-50 p-4 rounded-2xl">{cause.logo}</div>
                        <span className="px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg uppercase tracking-tight">Verified NGO</span>
                      </div>
                      
                      <h3 className="text-2xl font-black mb-6 text-slate-900 leading-tight">{cause.name}</h3>
                      
                      <div className="mt-auto">
                        <div className="flex justify-between items-end mb-4">
                          <p className="text-3xl font-black text-slate-900 tracking-tighter">
                            {cause.raised} <span className="text-sm font-bold text-slate-400">{cause.isTokenCause ? 'USDT' : 'BNB'}</span>
                          </p>
                          <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">{Math.round(progress)}%</span>
                        </div>
                        
                        <div className="w-full bg-slate-100 rounded-full h-3 mb-8 overflow-hidden">
                          <div className="h-full bg-linear-to-r from-emerald-500 to-teal-400 transition-all duration-1000" style={{ width: `${Math.min(progress, 100)}%` }} />
                        </div>
                        
                        {/* Dynamic Amount Input */}
                        <div className="mb-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Donation Amount ({cause.isTokenCause ? 'USDT' : 'BNB'})</label>
                          <div className="relative">
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder={cause.isTokenCause ? "10" : "0.01"}
                              value={donationAmounts[cause.id] || ''}
                              onChange={(e) => setDonationAmounts({...donationAmounts, [cause.id]: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm font-black focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-600">
                             ≈ ${(parseFloat(donationAmounts[cause.id] || '0') * (cause.isTokenCause ? 1 : 2500)).toFixed(2)} USD
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleDonate(cause.id, cause.isTokenCause)}
                          disabled={isProcessing}
                          className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-black text-sm shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                          {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                          {isProcessing ? 'PROCESSING...' : 'SEND DONATION'}
                        </button>
                      </div>
                    </div>

                    {/* Proof of Impact Gallery Feed */}
                    {cause.updates.length > 0 && (
                      <div className="bg-slate-50 px-8 py-6 border-t border-slate-200">
                        <div className="flex items-center gap-2 mb-4">
                          <ImageIcon className="w-3 h-3 text-slate-400" />
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Proof of Impact Gallery</span>
                        </div>
                        <div className="space-y-3">
                          {cause.updates.map((update, idx) => (
                             <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3">
                               <div className="bg-emerald-100 p-1.5 rounded-md"><History className="w-3 h-3 text-emerald-600" /></div>
                               <p className="text-[11px] font-bold text-slate-600">{update}</p>
                             </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar: Leaderboard & Rewards */}
          <div className="lg:col-span-4 space-y-8">
            {/* Impact Leaderboard */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-8">
                <Trophy className="text-amber-500 w-6 h-6" />
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Global Leaderboard</h3>
              </div>
              <div className="space-y-4">
                {leaderboard.map((entry) => (
                  <div key={entry.address} className={`flex items-center justify-between p-4 rounded-2xl border ${entry.address.includes('You') || entry.address.toLowerCase() === account?.toLowerCase() ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-50'}`}>
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-sm font-black text-slate-400">#{entry.rank}</span>
                      <span className="text-sm font-bold text-slate-700 font-mono">{entry.address}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">{entry.total} BNB</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reward Card */}
            <div className="bg-linear-to-br from-slate-900 to-slate-800 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -m-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
              <div className="relative z-10 text-center">
                <div className="bg-white/10 w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center border border-white/20 backdrop-blur-sm shadow-2xl">
                  {hasReward ? (
                    <Trophy className="w-12 h-12 text-amber-400" />
                  ) : (
                    <Star className="w-12 h-12 text-white/50" />
                  )}
                </div>
                <h3 className="text-2xl font-black mb-4">God Tier Rewards</h3>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                  Donate 0.5+ BNB total ($1,250+) to unlock your exclusive **Proof of Impact** NFT Badge.
                </p>
                {hasReward ? (
                  <div className="bg-emerald-500/20 text-emerald-400 py-3 rounded-2xl border border-emerald-500/30 text-[10px] font-black tracking-[0.2em] uppercase">
                    STATUS: IMPACT_REWARD_CLAIMED
                  </div>
                ) : (
                    <div className="text-emerald-500 text-[10px] font-black bg-emerald-500/10 py-3 rounded-2xl border border-emerald-500/10">
                      TIER: BRONZE_SUPPORTER
                    </div>
                )}
              </div>
            </div>
            
            {/* Live Feed */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
               <div className="flex items-center gap-3 mb-6">
                 <Bell className="text-rose-500 w-5 h-5" />
                 <h3 className="text-lg font-black text-slate-900">Live Activity</h3>
               </div>
               <div className="space-y-4">
                 {activities.map(act => (
                   <div key={act.id} className="flex gap-4 group">
                     <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                       <TrendingUp className="w-5 h-5 text-emerald-600" />
                     </div>
                     <div>
                       <p className="text-xs font-black text-slate-900">{act.amount} {act.token}</p>
                       <p className="text-[10px] text-slate-400 font-bold uppercase">{act.time}</p>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
