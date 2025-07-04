import TokenDashboard from '@/components/TokenDashboard';
import WalletIndicator from '@/components/WalletIndicator';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950">
      <WalletIndicator />
      <div className="container mx-auto px-4 py-8">
        <TokenDashboard />
      </div>
    </div>
  );
} 