import { useState, useEffect } from 'react';
import { Wallet, HeartHandshake, ShieldCheck, AlertCircle, TrendingUp, Download, Bell, ExternalLink, Coins } from 'lucide-react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, USDT_ADDRESS, ERC20_ABI } from './contract';

interface Cause {
  id: number;
  name: string;
  goalAmount: string;
  raised: string;
  ngo: string;
  logo: string;
  isTokenCause: boolean;
}

interface Activity {
  id: string;
  donor: string;
  amount: string;
  token: string;
  time: string;
}

function App() {
  const [account, setAccount] = useState<string>('');
  const [causes, setCauses] = useState<Cause[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isNGO, setIsNGO] = useState<boolean>(false);

  const connectWallet = async () => {
    if ((window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (error) {
        console.error(error);
      }
    } else {
      alert('Please install MetaMask');
    }
  };

  const fetchCauses = async () => {
    try {
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      const count = await contract.causeCount();
      const fetchedCauses: Cause[] = [];
      
      for (let i = 1; i <= Number(count); i++) {
        const cause = await contract.causes(i);
        const bnbBalance = await contract.causeBalances(i, ethers.ZeroAddress);
        const usdtBalance = await contract.causeBalances(i, USDT_ADDRESS);
        
        const isToken = cause.name.includes("(USDT)"); // Simple logic for demo
        const raised = isToken ? ethers.formatUnits(usdtBalance, 18) : ethers.formatEther(bnbBalance);
        
        fetchedCauses.push({
          id: Number(cause.id),
          name: cause.name,
          goalAmount: isToken ? ethers.formatUnits(cause.goalAmount, 18) : ethers.formatEther(cause.goalAmount),
          raised: raised,
          ngo: cause.verifiedNGO,
          logo: isToken ? "🪙" : "🌊",
          isTokenCause: isToken
        });
      }
      setCauses(fetchedCauses);
    } catch (error) {
      console.error("Error fetching causes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async (causeId: number, isToken: boolean) => {
    if (!(window as any).ethereum) return;
    
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const network = await provider.getNetwork();
      
      if (network.chainId !== BigInt(31337)) {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x7a69' }],
        });
        return;
      }

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      if (isToken) {
        const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
        const amount = ethers.parseUnits("100", 18); // Default 100 USDT
        
        // Approve first
        const allowance = await usdt.allowance(account, CONTRACT_ADDRESS);
        if (allowance < amount) {
          const approveTx = await usdt.approve(CONTRACT_ADDRESS, amount);
          await approveTx.wait();
        }
        
        const tx = await contract.donateTokenToCause(causeId, USDT_ADDRESS, amount);
        await tx.wait();
      } else {
        const tx = await contract.donateToCause(causeId, {
          value: ethers.parseEther("0.1")
        });
        await tx.wait();
      }
      
      alert("Donation successful!");
      fetchCauses();
    } catch (error: any) {
      console.error("Donation failed:", error);
      alert(`Error: ${error.reason || error.message}`);
    }
  };

  const handleWithdraw = async (causeId: number, isToken: boolean) => {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const tokenAddr = isToken ? USDT_ADDRESS : ethers.ZeroAddress;
      const tx = await contract.withdraw(causeId, tokenAddr);
      await tx.wait();
      alert("Withdrawal successful!");
      fetchCauses();
    } catch (error: any) {
      alert("Withdrawal failed. Are you the verified NGO?");
    }
  };

  const listenToEvents = () => {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    
    contract.on("DonationReceived", (causeId, donor, token, amount) => {
      const isUSDT = token.toLowerCase() === USDT_ADDRESS.toLowerCase();
      const formattedAmount = isUSDT ? ethers.formatUnits(amount, 18) : ethers.formatEther(amount);
      const symbol = isUSDT ? "USDT" : "BNB";
      
      setActivities(prev => [{
        id: Math.random().toString(),
        donor: donor,
        amount: formattedAmount,
        token: symbol,
        time: new Date().toLocaleTimeString()
      }, ...prev].slice(0, 5));
    });
  };

  useEffect(() => {
    fetchCauses();
    listenToEvents();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-emerald-100">
      {/* Premium Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-2xl shadow-lg shadow-emerald-100 group-hover:scale-110 transition-transform">
                <HeartHandshake className="text-white w-7 h-7" />
              </div>
              <span className="font-black text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                AltruBSC
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-6 mr-6 text-sm font-semibold text-slate-500">
                <a href="#" className="hover:text-emerald-600 transition-colors">Causes</a>
                <a href="#" className="hover:text-emerald-600 transition-colors">NGO Directory</a>
                <a href="#" className="hover:text-emerald-600 transition-colors">Transparency</a>
              </div>
              {account ? (
                <div className="flex items-center gap-3 bg-slate-50 p-1.5 pr-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                    <Wallet className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">{`${account.slice(0, 6)}...${account.slice(-4)}`}</span>
                </div>
              ) : (
                <button 
                  onClick={connectWallet}
                  className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-slate-200 flex items-center gap-2 hover:-translate-y-0.5"
                >
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="relative mb-24">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-emerald-50/50 -z-10 blur-3xl rounded-full" />
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-700 text-sm font-bold mb-8 animate-fade-in">
              <ShieldCheck className="w-4 h-4" />
              100% On-Chain Verification
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-[1.1] tracking-tight">
              Giving that stays <br /> 
              <span className="text-emerald-600">Perfectly Transparent.</span>
            </h1>
            <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              AltruBSC empowers verified NGOs to raise funds in BNB or Stablecoins with real-time traceability and zero intermediaries.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content: Causes */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-emerald-500 rounded-full" />
                <h2 className="text-3xl font-black text-slate-900">Active Pools</h2>
              </div>
              <div className="flex gap-2">
                <span className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">BNB Pools</span>
                <span className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">Stablecoin Pools</span>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
                {[1,2,3,4].map(i => <div key={i} className="bg-slate-100 h-80 rounded-3xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {causes.map((cause) => {
                  const progress = (Number(cause.raised) / Number(cause.goalAmount)) * 100;
                  const isFunded = progress >= 100;
                  const isNGOOwner = account.toLowerCase() === cause.ngo.toLowerCase();
                  
                  return (
                    <div key={cause.id} className="group bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 hover:shadow-2xl hover:shadow-emerald-100/50 transition-all duration-500 relative flex flex-col hover:-translate-y-2">
                       <div className="flex items-center justify-between mb-6">
                        <div className="bg-slate-50 w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-slate-100 group-hover:scale-110 transition-transform">
                          {cause.logo}
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Impact Partner</span>
                          <span className="px-3 py-1.5 bg-slate-900 text-white text-[11px] font-bold rounded-lg shadow-lg">
                            {cause.ngo.slice(0, 10)}...
                          </span>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-extrabold text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">{cause.name}</h3>
                      
                      <div className="mt-auto pt-6 border-t border-slate-50">
                        <div className="flex justify-between items-end mb-3">
                          <div>
                            <p className="text-2xl font-black text-slate-900">
                              {cause.raised} <span className="text-sm font-medium text-slate-500">{cause.isTokenCause ? 'USDT' : 'BNB'}</span>
                            </p>
                            <p className="text-xs font-bold text-slate-400">Target: {cause.goalAmount} {cause.isTokenCause ? 'USDT' : 'BNB'}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                              {Math.round(progress)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 mb-8 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${isFunded ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-500 to-blue-500'} transition-all duration-1000 ease-out`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleDonate(cause.id, cause.isTokenCause)}
                            disabled={isFunded || !account}
                            className={`flex-1 py-4 rounded-2xl font-black text-sm tracking-wide transition-all ${
                              isFunded 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : !account
                                  ? 'bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 active:scale-95'
                            }`}
                          >
                            {isFunded ? 'FULLY FUNDED' : !account ? 'CONNECT WALLET' : cause.isTokenCause ? 'DONATE 100 USDT' : 'DONATE 0.1 BNB'}
                          </button>
                          
                          {isNGOOwner && (
                            <button 
                              onClick={() => handleWithdraw(cause.id, cause.isTokenCause)}
                              className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-black transition-colors shadow-lg active:scale-95"
                              title="Withdraw Funds (NGO only)"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar: Activity & Stats */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="text-rose-500 w-5 h-5" />
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Live Activity</h3>
              </div>
              
              <div className="space-y-6">
                {activities.length > 0 ? activities.map(act => (
                  <div key={act.id} className="flex gap-4 group animate-slide-in">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {act.amount} {act.token} Donated
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">{act.donor.slice(0, 6)}...{act.donor.slice(-4)}</span>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{act.time}</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12">
                    <div className="bg-slate-50 w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center border border-slate-100">
                      <Coins className="text-slate-300 w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-slate-400">Waiting for donations...</p>
                  </div>
                )}
              </div>
              
              {activities.length > 0 && (
                <button className="w-full mt-8 py-3 bg-slate-50 text-slate-500 text-xs font-bold rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                  View On BSC Scan <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-8 text-white shadow-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 -m-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <ShieldCheck className="w-12 h-12 text-emerald-400 mb-6" />
                <h3 className="text-xl font-extrabold mb-4">Become an Impact Partner</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  Join the most transparent donation network on BSC. Verified NGOs get zero fees and instant settlements.
                </p>
                <button className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-sm hover:bg-emerald-50 transition-colors shadow-xl">
                  Register NGO
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-200 mt-12 text-center text-slate-400 text-sm font-medium">
        © 2026 AltruBSC Protocol. Built for social impact on Binance Smart Chain.
      </footer>
    </div>
  );
}

export default App;
