import { useState, useEffect } from 'react';
import { Wallet, HeartHandshake, ShieldCheck, AlertCircle, TrendingUp } from 'lucide-react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './contract';

interface Cause {
  id: number;
  name: string;
  goalAmount: string;
  raised: string;
  ngo: string;
  logo: string;
}

function App() {
  const [account, setAccount] = useState<string>('');
  const [causes, setCauses] = useState<Cause[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
        const balance = await contract.causeBalances(i, ethers.ZeroAddress);
        
        fetchedCauses.push({
          id: Number(cause.id),
          name: cause.name,
          goalAmount: ethers.formatEther(cause.goalAmount),
          raised: ethers.formatEther(balance),
          ngo: cause.verifiedNGO,
          logo: "🌟"
        });
      }
      setCauses(fetchedCauses);
    } catch (error) {
      console.error("Error fetching causes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async (causeId: number) => {
    if (!(window as any).ethereum) return;
    
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const network = await provider.getNetwork();
      
      // Hardhat Local Chain ID is 31337
      if (network.chainId !== 31337n) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x7a69' }], // 31337 in hex
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            alert("Please add the Hardhat Local Network (Chain ID 31337) to MetaMask first.");
          } else {
            alert("Please switch MetaMask to the Hardhat Local network.");
          }
          return;
        }
      }

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const tx = await contract.donateToCause(causeId, {
        value: ethers.parseEther("0.1")
      });
      
      await tx.wait();
      alert("Donation successful!");
      fetchCauses();
    } catch (error: any) {
      console.error("Donation failed details:", error);
      alert(`Donation failed: ${error.reason || error.message || "Unknown error"}. Check the browser console (F12) for logs.`);
    }
  };

  useEffect(() => {
    fetchCauses();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <HeartHandshake className="text-emerald-500 w-8 h-8" />
              <span className="font-bold text-xl tracking-tight text-slate-900">BinanceCare</span>
            </div>
            <div>
              {account ? (
                <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-medium">{`${account.slice(0, 6)}...${account.slice(-4)}`}</span>
                </div>
              ) : (
                <button 
                  onClick={connectWallet}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-full font-medium transition-colors shadow-sm shadow-emerald-200 flex items-center gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
            Transparent Donations on <span className="text-yellow-500">Binance Smart Chain</span>
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            Empowering verified NGOs to raise emergency funds with 100% on-chain transparency. Every transaction is verifiable and secure.
          </p>
          <div className="flex justify-center gap-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 w-48 hover:shadow-md transition-shadow">
              <div className="bg-emerald-100 p-2.5 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Verified NGOs</p>
                <p className="text-xl font-bold text-slate-800">Local Dev</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 w-48 hover:shadow-md transition-shadow">
              <div className="bg-blue-100 p-2.5 rounded-xl">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Active Causes</p>
                <p className="text-xl font-bold text-slate-800">{causes.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle className="text-rose-500 w-6 h-6" />
            <h2 className="text-2xl font-bold text-slate-900">Emergency Crowdfunding Pools</h2>
          </div>
          
          {loading ? (
            <div className="text-center py-20">Loading causes...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {causes.map((cause) => {
                const progress = (Number(cause.raised) / Number(cause.goalAmount)) * 100;
                const isFunded = progress >= 100;
                return (
                  <div key={cause.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 relative overflow-hidden group hover:-translate-y-1">
                    <div className="absolute top-0 right-0 -m-4 w-24 h-24 bg-gradient-to-br from-emerald-100 to-transparent rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-4xl shadow-sm">{cause.logo}</span>
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full border border-slate-200 shadow-sm overflow-hidden text-ellipsis max-w-[150px]">
                          {cause.ngo}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{cause.name}</h3>
                      
                      <div className="mt-6">
                        <div className="flex justify-between text-sm font-medium mb-2">
                          <span className="text-emerald-600">{cause.raised} BNB Raised</span>
                          <span className="text-slate-500">Goal: {cause.goalAmount} BNB</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 mb-6 overflow-hidden">
                          <div 
                            className={`h-2.5 rounded-full ${isFunded ? 'bg-emerald-500' : 'bg-blue-500'} transition-all duration-1000 ease-out`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                        
                        <button 
                          onClick={() => handleDonate(cause.id)}
                          disabled={isFunded || !account}
                          className={`w-full py-3 rounded-xl font-medium transition-all ${
                            isFunded 
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : !account
                                ? 'bg-slate-800 text-white opacity-50 cursor-not-allowed'
                                : 'bg-slate-900 hover:bg-black text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                          }`}
                        >
                          {isFunded ? 'Goal Reached' : !account ? 'Connect to Donate' : 'Donate 0.1 BNB'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
