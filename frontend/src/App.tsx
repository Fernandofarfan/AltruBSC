import { useState, useEffect } from 'react';
import { Wallet, HeartHandshake, ShieldCheck, TrendingUp, Download, Bell, ExternalLink, Coins, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
  const [networkOk, setNetworkOk] = useState<boolean>(true);
  const [txStatus, setTxStatus] = useState<string>('');
  const [processingId, setProcessingId] = useState<number | null>(null);

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
        setTxStatus("Adding Hardhat network to MetaMask...");
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
          setTxStatus("Network added and switched!");
        } catch (addError) {
          setTxStatus("Failed to add network. Please do it manually.");
        }
      } else {
        setTxStatus("Network switch failed.");
      }
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
        
        const isToken = cause.name.includes("(USDT)");
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
      console.error("Error fetching:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async (causeId: number, isToken: boolean) => {
    if (!account) {
      connectWallet();
      return;
    }
    if (!networkOk) {
      switchNetwork();
      return;
    }
    
    setProcessingId(causeId);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      if (isToken) {
        setTxStatus("Checking USDT allowance...");
        const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
        const amount = ethers.parseUnits("100", 18);
        
        const allowance = await usdt.allowance(account, CONTRACT_ADDRESS);
        if (allowance < amount) {
          setTxStatus("Aproval required: Sign in MetaMask...");
          const approveTx = await usdt.approve(CONTRACT_ADDRESS, amount);
          setTxStatus("Waiting for approval on chain...");
          await approveTx.wait();
        }
        
        setTxStatus("Sending donation: Sign in MetaMask...");
        const tx = await contract.donateTokenToCause(causeId, USDT_ADDRESS, amount);
        setTxStatus("Processing transaction...");
        await tx.wait();
      } else {
        setTxStatus("Sending donation: Sign in MetaMask...");
        const tx = await contract.donateToCause(causeId, {
          value: ethers.parseEther("0.1")
        });
        setTxStatus("Processing transaction...");
        await tx.wait();
      }
      
      setTxStatus("DONATION SUCCESSFUL!");
      fetchCauses();
    } catch (error: any) {
      console.error("Fail:", error);
      setTxStatus(`Error: ${error.reason || error.message}`);
    } finally {
      setProcessingId(null);
      setTimeout(() => setTxStatus(''), 5000);
    }
  };

  const handleWithdraw = async (causeId: number, isToken: boolean) => {
    setTxStatus("Processing withdrawal...");
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const tokenAddr = isToken ? USDT_ADDRESS : ethers.ZeroAddress;
      const tx = await contract.withdraw(causeId, tokenAddr);
      await tx.wait();
      setTxStatus("Withdrawal Success!");
      fetchCauses();
    } catch (error: any) {
      setTxStatus("Withdrawal Failed: Are you the NGO?");
    } finally {
      setTimeout(() => setTxStatus(''), 5000);
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
    if ((window as any).ethereum) {
      (window as any).ethereum.on('chainChanged', () => window.location.reload());
      (window as any).ethereum.on('accountsChanged', (accounts: string[]) => setAccount(accounts[0]));
      checkNetwork();
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-emerald-100 pb-20">
      {/* Network Warning Banner */}
      {!networkOk && account && (
        <div className="bg-rose-600 text-white py-3 px-4 text-center font-bold flex items-center justify-center gap-3 animate-pulse sticky top-0 z-[60]">
          <AlertTriangle className="w-5 h-5" />
          You are on the wrong network! Please switch to Hardhat Local (Chain ID 31337)
          <button onClick={switchNetwork} className="bg-white text-rose-600 px-3 py-1 rounded-lg text-xs hover:bg-rose-50 transition-colors ml-4">
            Switch Now
          </button>
        </div>
      )}

      {/* Dynamic Status Notification */}
      {txStatus && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 animate-slide-up border border-slate-700 max-w-lg w-full">
          {txStatus.includes("SUCCESS") || txStatus.includes("connected") ? (
             <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          ) : txStatus.includes("Error") || txStatus.includes("failed") ? (
             <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
          ) : (
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin shrink-0" />
          )}
          <span className="text-sm font-bold tracking-tight truncate">{txStatus}</span>
        </div>
      )}

      {/* Premium Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-2xl shadow-lg shadow-emerald-100 group-hover:scale-110 transition-transform">
                <HeartHandshake className="text-white w-7 h-7" />
              </div>
              <span className="font-black text-2xl tracking-tighter text-slate-900">
                AltruBSC
              </span>
            </div>
            <div className="flex items-center gap-4">
              {account ? (
                <div className="flex items-center gap-3 bg-slate-50 p-1.5 pr-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                    <Wallet className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">{`${account.slice(0, 6)}...${account.slice(-4)}`}</span>
                  {!networkOk && <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-2" />}
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-700 text-sm font-bold mb-8 animate-fade-in shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              Real-time Blockchain Verification
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-[1.1] tracking-tight">
              Bridging Transparency <br /> 
              <span className="text-emerald-600">to Every Impact.</span>
            </h1>
            <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
              A decentralized gateway for emergency funding. Connect, donate, and track every token from your wallet to the final cause.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content: Causes */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Operational Pools</h2>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1,2].map(i => <div key={i} className="bg-white border border-slate-200 h-96 rounded-[2.5rem] p-8 animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {causes.map((cause) => {
                  const progress = (Number(cause.raised) / Number(cause.goalAmount)) * 100;
                  const isFunded = progress >= 100;
                  const isNGOOwner = account.toLowerCase() === cause.ngo.toLowerCase();
                  const isProcessing = processingId === cause.id;
                  
                  return (
                    <div key={cause.id} className="group bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 hover:shadow-2xl hover:shadow-emerald-100/30 transition-all duration-500 relative flex flex-col hover:-translate-y-2">
                       <div className="flex items-center justify-between mb-8">
                        <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-slate-100 group-hover:scale-110 transition-transform duration-500">
                          {cause.logo}
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Partner Address</span>
                          <span className="px-3 py-2 bg-slate-900 text-white text-[11px] font-bold rounded-xl shadow-lg font-mono">
                            {cause.ngo.slice(0, 6)}...{cause.ngo.slice(-4)}
                          </span>
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-emerald-700 transition-colors leading-tight">{cause.name}</h3>
                      
                      <div className="mt-auto pt-8 border-t border-dashed border-slate-200">
                        <div className="flex justify-between items-end mb-4">
                          <div>
                            <p className="text-3xl font-black text-slate-900 tracking-tight">
                              {cause.raised} <span className="text-lg font-bold text-slate-400">{cause.isTokenCause ? 'USDT' : 'BNB'}</span>
                            </p>
                            <p className="text-sm font-bold text-slate-400 mt-1">Goal: {cause.goalAmount} {cause.isTokenCause ? 'USDT' : 'BNB'}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                              {Math.round(progress)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-4 mb-8 p-1 overflow-hidden shadow-inner">
                          <div 
                            className={`h-full rounded-full ${isFunded ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 bg-[length:200%_auto] animate-gradient'} transition-all duration-1000 ease-out`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleDonate(cause.id, cause.isTokenCause)}
                            disabled={isFunded || isProcessing}
                            className={`flex-1 py-5 rounded-[1.5rem] font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-3 ${
                              isFunded 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : isProcessing
                                  ? 'bg-slate-800 text-white cursor-wait'
                                  : !account
                                    ? 'bg-slate-900 hover:bg-black text-white'
                                    : !networkOk
                                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-100'
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-200 active:scale-95'
                            }`}
                          >
                            {isProcessing ? (
                               <Loader2 className="w-5 h-5 animate-spin" />
                            ) : null}
                            {isFunded ? 'FULL' : !account ? 'CONNECT TO DONATE' : !networkOk ? 'SWITCH NETWORK' : cause.isTokenCause ? 'DONATE 100 USDT' : 'DONATE 0.1 BNB'}
                          </button>
                          
                          {isNGOOwner && (
                            <button 
                              onClick={() => handleWithdraw(cause.id, cause.isTokenCause)}
                              className="p-5 bg-slate-900 text-white rounded-[1.5rem] hover:bg-black transition-all shadow-xl active:scale-95 group/btn"
                              title="Withdraw Funds (NGO only)"
                            >
                              <Download className="w-6 h-6 group-hover/btn:animate-bounce" />
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
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 ring-1 ring-slate-100">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-rose-100 p-2 rounded-xl">
                    <Bell className="text-rose-600 w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight font-mono">LATEST_TXS</h3>
                </div>
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              </div>
              
              <div className="space-y-6">
                {activities.length > 0 ? activities.map(act => (
                  <div key={act.id} className="flex gap-4 group animate-slide-in p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                      <TrendingUp className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-base font-black text-slate-900 tracking-tight">
                        {act.amount} {act.token}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded-md">{act.donor.slice(0, 6)}...</span>
                        <span className="text-[10px] text-slate-300 font-bold leading-none">@</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{act.time}</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                    <Coins className="text-slate-300 w-10 h-10 mx-auto mb-4 opacity-50" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Listening for events...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group border border-slate-700">
              <div className="absolute top-0 right-0 -m-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10">
                <div className="bg-emerald-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-8 border border-emerald-500/20">
                  <HeartHandshake className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-black mb-4 tracking-tight leading-tight">NGO Certification <br />Programme</h3>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed font-medium">
                  Boost your NGO's trust level. Get listed in our verified directory and access advanced treasury tools.
                </p>
                <button className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black text-sm hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-950/20 hover:-translate-y-1 active:translate-y-0">
                  Apply for Verification
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200 mt-24">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-40 grayscale">
            <HeartHandshake className="w-6 h-6" />
            <span className="font-bold text-lg tracking-tighter">AltruBSC</span>
          </div>
          <div className="text-slate-400 text-[11px] font-black tracking-widest uppercase">
            © 2026 Secured by Binance Smart Chain • Open Source Impact
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
