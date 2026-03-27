import { useState, useEffect } from 'react';
import { Heart, Loader2, Moon, Sun, LogOut } from 'lucide-react';
import { ethers } from 'ethers';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { CONTRACT_ADDRESS, CONTRACT_ABI, USDT_ADDRESS, ERC20_ABI } from './contract';

interface Cause {
  id: number;
  name: string;
  goal: string;
  raised: string;
  isToken: boolean;
}

function App() {
  const [account, setAccount] = useState<string>('');
  const [causes, setCauses] = useState<Cause[]>([]);
  const [isDark, setIsDark] = useState(false);
  const [isSpanish, setIsSpanish] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [donationAmounts, setDonationAmounts] = useState<Record<number, string>>({});
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [donorStats, setDonorStats] = useState({ totalDonated: '0', count: '0' });

  const t = {
    en: {
      title: 'AltruBSC',
      subtitle: 'Blockchain Donations',
      connect: 'Connect Wallet',
      disconnect: 'Disconnect',
      donate: 'Donate Now',
      network: 'Hardhat Local Network',
      goal: 'Goal',
      raised: 'Raised',
      amount: 'Amount',
      language: 'ES',
      networkError: 'Please connect to Hardhat Local Network (127.0.0.1:8545)',
      causes: 'Active Causes',
      donorInfo: 'Your Impact',
      totalDonated: 'Total Donated',
      donationCount: 'Donations',
      status: 'Status',
      success: 'Donation successful!',
      selectAmount: 'Enter amount',
      connecting: 'Connecting...',
      donating: 'Processing...',
      error: 'Error'
    },
    es: {
      title: 'AltruBSC',
      subtitle: 'Donaciones Blockchain',
      connect: 'Conectar Wallet',
      disconnect: 'Desconectar',
      donate: 'Donar Ahora',
      network: 'Red Local Hardhat',
      goal: 'Meta',
      raised: 'Recaudado',
      amount: 'Cantidad',
      language: 'EN',
      networkError: 'Por favor conecta a la Red Local Hardhat (127.0.0.1:8545)',
      causes: 'Causas Activas',
      donorInfo: 'Tu Impacto',
      totalDonated: 'Total Donado',
      donationCount: 'Donaciones',
      status: 'Estado',
      success: '¡Donación exitosa!',
      selectAmount: 'Ingresa cantidad',
      connecting: 'Conectando...',
      donating: 'Procesando...',
      error: 'Error'
    }
  }[isSpanish ? 'es' : 'en'];

  const checkNetwork = async () => {
    if (!(window as any).ethereum) return false;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const network = await provider.getNetwork();
      return network.chainId === BigInt(31337);
    } catch {
      return false;
    }
  };

  const connectWallet = async () => {
    try {
      if (!(window as any).ethereum) {
        setError('MetaMask not found');
        return;
      }
      setLoading(true);
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      const isCorrectNetwork = await checkNetwork();
      if (!isCorrectNetwork) {
        setError(t.networkError);
      } else {
        setError('');
        await fetchData(accounts[0]);
      }
    } catch (err) {
      setError('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (addressForDonorInfo?: string) => {
    try {
      const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      const count = await contract.causeCount();
      const fetchedCauses: Cause[] = [];
      
      for (let i = 1; i <= Number(count); i++) {
        const cause = await contract.causes(i);
        const bnbBal = await contract.causeBalances(i, ethers.ZeroAddress);
        const usdtBal = await contract.causeBalances(i, USDT_ADDRESS);
        const isToken = cause.name.includes('USDT');
        const raised = isToken ? ethers.formatUnits(usdtBal, 18) : ethers.formatEther(bnbBal);
        const goal = isToken ? ethers.formatUnits(cause.goalAmount, 18) : ethers.formatEther(cause.goalAmount);
        
        fetchedCauses.push({
          id: Number(cause.id),
          name: cause.name,
          goal,
          raised,
          isToken
        });
      }
      setCauses(fetchedCauses);

      if (addressForDonorInfo) {
        const donor = await contract.donors(addressForDonorInfo);
        setDonorStats({
          totalDonated: ethers.formatEther(donor.totalDonated),
          count: donor.donationCount.toString()
        });
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleDonate = async (causeId: number, isToken: boolean) => {
    if (!account) {
      await connectWallet();
      return;
    }

    const isCorrectNetwork = await checkNetwork();
    if (!isCorrectNetwork) {
      setError(t.networkError);
      return;
    }

    const amount = donationAmounts[causeId];
    if (!amount || parseFloat(amount) <= 0) {
      setError(t.selectAmount);
      return;
    }

    setProcessingId(causeId);
    setError('');

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      if (isToken) {
        const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
        const parsedAmount = ethers.parseUnits(amount, 18);
        const allowance = await usdt.allowance(account, CONTRACT_ADDRESS);
        
        if (allowance < parsedAmount) {
          await (await usdt.approve(CONTRACT_ADDRESS, parsedAmount)).wait();
        }
        
        await (await contract.donateTokenToCause(causeId, USDT_ADDRESS, parsedAmount)).wait();
      } else {
        await (await contract.donateToCause(causeId, { value: ethers.parseEther(amount) })).wait();
      }

      confetti();
      setDonationAmounts({ ...donationAmounts, [causeId]: '' });
      setError('');
      await fetchData(account);
    } catch (err: any) {
      setError(err.message || 'Donation failed');
    } finally {
      setProcessingId(null);
    }
  };

  const disconnectWallet = () => {
    setAccount('');
    setDonorStats({ totalDonated: '0', count: '0' });
    setCauses([]);
  };

  useEffect(() => {
    fetchData();
    if ((window as any).ethereum) {
      (window as any).ethereum.on('chainChanged', () => window.location.reload());
      (window as any).ethereum.on('accountsChanged', (accs: string[]) => {
        if (accs.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accs[0]);
          fetchData(accs[0]);
        }
      });
    }
  }, []);

  const totalRaised = causes.reduce((acc, c) => acc + parseFloat(c.raised), 0);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'
    }`}>
      
      {/* Header */}
      <header className={`sticky top-0 z-40 transition-all border-b ${
        isDark ? 'border-zinc-800 bg-black/80 backdrop-blur-md' : 'border-zinc-200 bg-white/80 backdrop-blur-md'
      }`}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className={`p-1.5 rounded-md ${isDark ? 'bg-zinc-800 text-zinc-100' : 'bg-black text-white'}`}>
              <Heart className="w-4 h-4" />
            </div>
            <span className="font-semibold tracking-tight text-sm">AltruBSC</span>
            <span className={`text-xs ml-2 px-2 py-0.5 rounded-full border ${
              isDark ? 'border-zinc-800 text-zinc-400 bg-zinc-900/50' : 'border-zinc-200 text-zinc-500 bg-zinc-50'
            }`}>{isSpanish ? 'Donaciones' : 'Donations'}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSpanish(!isSpanish)}
              className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
                isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'
              }`}
            >
              {t.language}
            </button>
            
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-1.5 rounded transition-colors ${
                isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {account ? (
              <div className="flex items-center pl-3 border-l border-zinc-200 dark:border-zinc-800 max-h-8">
                <span className={`text-xs font-mono px-3 ${
                  isDark ? 'text-zinc-300' : 'text-zinc-600'
                }`}>
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
                <button
                  onClick={disconnectWallet}
                  className={`p-1.5 rounded transition-colors ${
                    isDark ? 'hover:bg-red-950/40 text-zinc-400 hover:text-red-400' : 'hover:bg-red-50 text-zinc-400 hover:text-red-600'
                  }`}
                  title={t.disconnect}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={loading}
                className={`text-xs font-medium px-4 py-1.5 rounded-md transition-all flex items-center gap-2 ${
                  isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
                } disabled:opacity-50`}
              >
                {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                {t.connect}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-sm"
          >
            <div className={`p-4 rounded-xl border backdrop-blur-sm shadow-xl ${
              isDark ? 'border-red-900/50 bg-red-950/90 text-red-200' : 'border-red-200 bg-red-50 text-red-700'
            }`}>
              <p className="font-medium text-sm">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12 md:py-20">
        
        {/* Hero Section */}
        {!account && (
          <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-balance">
              {isSpanish ? 'Impacto Transparente.' : 'Transparent Impact.'}
            </h2>
            <p className={`text-base md:text-lg ${
              isDark ? 'text-zinc-400' : 'text-zinc-500'
            } max-w-xl mx-auto font-medium`}>
              {isSpanish ? 'Apoya causas verificadas directamente a través de blockchain sin intermediarios.' : 'Support verified causes directly through blockchain without intermediaries.'}
            </p>
          </div>
        )}
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          <div className={`p-6 rounded-2xl border ${
            isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-white'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-emerald-500' : 'bg-emerald-500'}`} />
              <p className={`text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-zinc-500' : 'text-zinc-500'
              }`}>{t.network}</p>
            </div>
            <p className="text-4xl font-bold tracking-tight mb-1">${totalRaised.toFixed(2)}</p>
            <p className={`text-sm font-medium ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
              Total Raised across {causes.length} {t.causes.toLowerCase()}
            </p>
          </div>

          {account && (
            <div className={`p-6 rounded-2xl border ${
              isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-white'
            }`}>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-4 ${
                isDark ? 'text-zinc-500' : 'text-zinc-500'
              }`}>{t.donorInfo}</p>
              <div className="flex justify-between items-end">
                <div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <p className="text-4xl font-bold tracking-tight">{parseFloat(donorStats.totalDonated).toFixed(2)}</p>
                    <span className="text-sm font-medium text-zinc-500 mb-1">BNB</span>
                  </div>
                  <p className="text-sm font-medium text-zinc-500">{t.totalDonated}</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold tracking-tight mb-1">{donorStats.count}</p>
                  <p className="text-sm font-medium text-zinc-500">{t.donationCount}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Causes Grid */}
        <div className="space-y-6">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>{t.causes}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {causes.map((cause) => {
            const progress = (parseFloat(cause.raised) / parseFloat(cause.goal)) * 100;
            const isProcessing = processingId === cause.id;
            
            return (
              <div
                key={cause.id}
                className={`p-6 rounded-2xl border transition-all ${
                  isDark ? 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700' : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-base font-semibold tracking-tight mb-1">{cause.name}</h3>
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider ${
                      cause.isToken 
                        ? (isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600')
                        : (isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600')
                    }`}>
                      {cause.isToken ? 'USDT' : 'BNB'}
                    </span>
                  </div>
                </div>
                
                {/* Progress Section */}
                <div className="mb-6">
                  <div className="flex justify-between items-baseline mb-2">
                    <p className="text-xl font-bold tracking-tight">
                      {parseFloat(cause.raised).toFixed(2)}
                      <span className={`text-xs ml-1 font-medium ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                        / {parseFloat(cause.goal).toFixed(2)} {cause.isToken ? 'USDT' : 'BNB'}
                      </span>
                    </p>
                    <span className={`text-xs font-semibold ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                    isDark ? 'bg-zinc-800' : 'bg-zinc-200'
                  }`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        isDark ? 'bg-white' : 'bg-black'
                      }`}
                    />
                  </div>
                </div>

                {/* Donation Input */}
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder={t.selectAmount}
                    value={donationAmounts[cause.id] || ''}
                    onChange={(e) => setDonationAmounts({ ...donationAmounts, [cause.id]: e.target.value })}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors focus:outline-none focus:ring-1 ${
                      isDark 
                        ? 'border-zinc-800 bg-zinc-900 text-white placeholder-zinc-600 focus:border-zinc-600 focus:ring-zinc-600' 
                        : 'border-zinc-200 bg-zinc-50 text-black placeholder-zinc-400 focus:border-zinc-400 focus:ring-zinc-400'
                    }`}
                    disabled={!account || isProcessing}
                  />
                  <button
                    onClick={() => handleDonate(cause.id, cause.isToken)}
                    disabled={!account || isProcessing || !parseFloat(donationAmounts[cause.id] || '0')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-40 flex items-center justify-center gap-2 whitespace-nowrap text-sm ${
                      isDark 
                        ? 'bg-white text-black hover:bg-zinc-200 focus:ring-white/20' 
                        : 'bg-black text-white hover:bg-zinc-800 focus:ring-black/20'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDark ? 'focus:ring-offset-zinc-900' : 'focus:ring-offset-white'}`}
                  >
                    {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {t.donate}
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        </div>

        {causes.length === 0 && (
          <div className="text-center py-20 animate-in fade-in duration-500">
            <div className={`mx-auto w-8 h-8 mb-4 border-2 border-t-transparent rounded-full animate-spin ${
              isDark ? 'border-zinc-500' : 'border-zinc-400'
            }`} />
            <p className={`text-sm font-medium ${
              isDark ? 'text-zinc-500' : 'text-zinc-500'
            }`}>{t.causes} loading...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
